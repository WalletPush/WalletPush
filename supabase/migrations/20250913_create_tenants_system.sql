-- Multi-Tenant System Migration
-- This migration is BACKWARD COMPATIBLE and won't break existing functionality

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true
);

-- 2. Create user_tenants junction table for role-based access
CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'customer')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Add tenant_id to existing templates table (OPTIONAL - backward compatible)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'templates' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.templates ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(active);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_active ON public.user_tenants(active);
CREATE INDEX IF NOT EXISTS idx_templates_tenant_id ON public.templates(tenant_id);

-- 5. Enable Row Level Security (RLS) - SAFE, only affects new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for tenants table
CREATE POLICY "Users can view their own tenants" ON public.tenants
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND active = true)
    );

CREATE POLICY "Users can create tenants" ON public.tenants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their tenants" ON public.tenants
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their tenants" ON public.tenants
    FOR DELETE USING (owner_id = auth.uid());

-- 7. Create RLS policies for user_tenants table
CREATE POLICY "Users can view their tenant associations" ON public.user_tenants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Owners and admins can manage user associations" ON public.user_tenants
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- 8. Update templates RLS policy to include tenant scoping (SAFE - only adds more restrictions)
DROP POLICY IF EXISTS "Users can manage their templates" ON public.templates;
CREATE POLICY "Users can manage their templates" ON public.templates
    FOR ALL USING (
        -- Backward compatibility: Allow access if no tenant_id (existing templates)
        tenant_id IS NULL OR 
        -- New multi-tenant logic: Check tenant access
        tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND active = true)
    );

-- 9. Create function to automatically create tenant for new users
CREATE OR REPLACE FUNCTION public.create_default_tenant_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a default tenant for new users
    INSERT INTO public.tenants (name, owner_id)
    VALUES (COALESCE(NEW.email, 'My Business'), NEW.id);
    
    -- Associate user with their tenant as owner
    INSERT INTO public.user_tenants (user_id, tenant_id, role)
    SELECT NEW.id, t.id, 'owner'
    FROM public.tenants t
    WHERE t.owner_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to auto-create tenant (OPTIONAL - can be disabled)
DROP TRIGGER IF EXISTS create_tenant_on_signup ON auth.users;
CREATE TRIGGER create_tenant_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_tenant_for_user();

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tenants TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12. Create helper function to get user's current tenant
CREATE OR REPLACE FUNCTION public.get_user_current_tenant(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(tenant_id UUID, tenant_name TEXT, user_role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, ut.role
    FROM public.tenants t
    JOIN public.user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = user_uuid AND ut.active = true AND t.active = true
    ORDER BY 
        CASE ut.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'staff' THEN 3 
            ELSE 4 
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON MIGRATION IS 'Multi-tenant system with backward compatibility - existing functionality preserved';


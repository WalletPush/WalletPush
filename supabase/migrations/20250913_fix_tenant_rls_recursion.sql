-- EMERGENCY FIX: Remove recursive RLS policies causing infinite recursion
-- This is a CRITICAL fix needed to make the app functional

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.user_tenants;
DROP POLICY IF EXISTS "Owners and admins can manage user associations" ON public.user_tenants;

-- 2. Create SIMPLE, non-recursive policies for tenants table
CREATE POLICY "Users can view their owned tenants" ON public.tenants
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create tenants" ON public.tenants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their tenants" ON public.tenants
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their tenants" ON public.tenants
    FOR DELETE USING (owner_id = auth.uid());

-- 3. Create SIMPLE, non-recursive policies for user_tenants table
CREATE POLICY "Users can view their own associations" ON public.user_tenants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own associations" ON public.user_tenants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own associations" ON public.user_tenants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own associations" ON public.user_tenants
    FOR DELETE USING (user_id = auth.uid());

-- 4. Disable the auto-trigger that might be causing issues
DROP TRIGGER IF EXISTS create_tenant_on_signup ON auth.users;

COMMENT ON MIGRATION IS 'EMERGENCY FIX: Remove RLS recursion - simplified policies for basic functionality';

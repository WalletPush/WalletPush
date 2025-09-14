-- CREATE AGENCY PACKAGES TABLE
-- Run this in your Supabase SQL Editor to fix the SAAS Configurator

-- 1. Create the agency_packages table
CREATE TABLE IF NOT EXISTS public.agency_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_account_id UUID NOT NULL REFERENCES public.agency_accounts(id) ON DELETE CASCADE,
  package_name VARCHAR(100) NOT NULL,
  package_description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  pass_limit INTEGER NOT NULL DEFAULT 0,
  program_limit INTEGER NOT NULL DEFAULT 0,
  staff_limit INTEGER NOT NULL DEFAULT 0, -- -1 for unlimited
  features JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_packages_agency_account_id ON public.agency_packages(agency_account_id);
CREATE INDEX IF NOT EXISTS idx_agency_packages_active ON public.agency_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_agency_packages_display_order ON public.agency_packages(display_order);

-- 3. Add unique constraint for agency + display order
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_packages_unique_order 
ON public.agency_packages(agency_account_id, display_order);

-- 4. Enable RLS
ALTER TABLE public.agency_packages ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their agency packages" ON public.agency_packages;
DROP POLICY IF EXISTS "Users can insert their agency packages" ON public.agency_packages;
DROP POLICY IF EXISTS "Users can update their agency packages" ON public.agency_packages;
DROP POLICY IF EXISTS "Users can delete their agency packages" ON public.agency_packages;

-- 6. Create RLS Policies
CREATE POLICY "Users can view their agency packages" ON public.agency_packages
  FOR SELECT USING (
    agency_account_id IN (
      SELECT aa.id FROM public.agency_accounts aa
      WHERE aa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their agency packages" ON public.agency_packages
  FOR INSERT WITH CHECK (
    agency_account_id IN (
      SELECT aa.id FROM public.agency_accounts aa
      WHERE aa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their agency packages" ON public.agency_packages
  FOR UPDATE USING (
    agency_account_id IN (
      SELECT aa.id FROM public.agency_accounts aa
      WHERE aa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their agency packages" ON public.agency_packages
  FOR DELETE USING (
    agency_account_id IN (
      SELECT aa.id FROM public.agency_accounts aa
      WHERE aa.user_id = auth.uid()
    )
  );

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_agency_packages_updated_at ON public.agency_packages;
CREATE TRIGGER update_agency_packages_updated_at
    BEFORE UPDATE ON public.agency_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'agency_packages table created successfully!' as message;

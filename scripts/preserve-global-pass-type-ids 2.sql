-- Preserve Global Pass Type IDs Migration
-- This ensures all existing global Pass Type IDs continue to work in the new system

-- First, let's check what global Pass Type IDs exist
SELECT 
  id,
  label,
  pass_type_identifier,
  team_id,
  is_global,
  tenant_id,
  account_id,
  created_at
FROM pass_type_ids 
WHERE is_global = true 
ORDER BY created_at;

-- If the pass_type_ids table still uses tenant_id, we need to add account_id column
DO $$ 
BEGIN
    -- Add account_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pass_type_ids' AND column_name = 'account_id') THEN
        ALTER TABLE public.pass_type_ids ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_pass_type_ids_account_id ON public.pass_type_ids(account_id);
        
        RAISE NOTICE 'Added account_id column to pass_type_ids table';
    END IF;
END $$;

-- Migrate existing data from tenant_id to account_id (if tenant_id exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'pass_type_ids' AND column_name = 'tenant_id') THEN
        
        -- Update non-global Pass Type IDs to use account_id
        UPDATE public.pass_type_ids 
        SET account_id = tenant_id 
        WHERE tenant_id IS NOT NULL 
        AND is_global = false 
        AND account_id IS NULL;
        
        -- Ensure global Pass Type IDs have NULL account_id
        UPDATE public.pass_type_ids 
        SET account_id = NULL 
        WHERE is_global = true;
        
        RAISE NOTICE 'Migrated pass_type_ids from tenant_id to account_id';
    END IF;
END $$;

-- Ensure all global Pass Type IDs are properly marked
UPDATE public.pass_type_ids 
SET 
  account_id = NULL,
  is_global = true,
  is_validated = true
WHERE is_global = true;

-- Create a default global Pass Type ID if none exists
INSERT INTO public.pass_type_ids (
  account_id,
  label,
  pass_type_identifier,
  team_id,
  p12_path,
  p12_password_enc,
  is_validated,
  is_global
) 
SELECT 
  NULL,
  'WalletPush Global Certificate',
  'pass.com.walletpushio.global',
  'NC4W34D5LD',
  '/private/certificates/global/walletpush-global.p12',
  'encrypted_password_here',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.pass_type_ids WHERE is_global = true
);

-- Verify the results
SELECT 
  id,
  label,
  pass_type_identifier,
  team_id,
  is_global,
  account_id,
  created_at
FROM pass_type_ids 
WHERE is_global = true 
ORDER BY created_at;

RAISE NOTICE 'Global Pass Type IDs preservation complete!';

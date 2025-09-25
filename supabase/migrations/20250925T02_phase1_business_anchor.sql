-- PHASE 1 — Make businesses the single anchor + agency FK
-- 1) Rename businesses.agency_id → agency_account_id (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='businesses' AND column_name='agency_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='businesses' AND column_name='agency_account_id'
  ) THEN
    ALTER TABLE public.businesses RENAME COLUMN agency_id TO agency_account_id;
  END IF;
END$$;

-- 2) Enforce FK to agency_accounts(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='businesses'
      AND constraint_name='businesses_agency_account_id_fkey'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_agency_account_id_fkey
      FOREIGN KEY (agency_account_id) REFERENCES public.agency_accounts(id);
  END IF;
END$$;

-- 3) Transitional pointer to accounts(id)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS account_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='businesses'
      AND constraint_name='businesses_account_id_key'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_account_id_key UNIQUE (account_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='businesses'
      AND constraint_name='businesses_account_id_fkey'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id);
  END IF;
END$$;

-- 4) Align accounts.parent_agency_id to agency_accounts(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='accounts'
      AND constraint_name='accounts_parent_agency_id_fkey'
  ) THEN
    ALTER TABLE public.accounts DROP CONSTRAINT accounts_parent_agency_id_fkey;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='accounts'
      AND constraint_name='accounts_parent_agency_id_fkey'
  ) THEN
    ALTER TABLE public.accounts
      ADD CONSTRAINT accounts_parent_agency_id_fkey
      FOREIGN KEY (parent_agency_id) REFERENCES public.agency_accounts(id);
  END IF;
END$$;

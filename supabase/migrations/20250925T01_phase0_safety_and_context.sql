-- PHASE 0 — Safety & Context (Snapshots + Helper Map)
CREATE SCHEMA IF NOT EXISTS backup;

-- Backup tables (structure + data). Idempotent inserts.
CREATE TABLE IF NOT EXISTS backup.passes (LIKE public.passes INCLUDING ALL);
INSERT INTO backup.passes SELECT * FROM public.passes ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup.device_registrations (LIKE public.device_registrations INCLUDING ALL);
INSERT INTO backup.device_registrations SELECT * FROM public.device_registrations ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup.custom_fields (LIKE public.custom_fields INCLUDING ALL);
INSERT INTO backup.custom_fields SELECT * FROM public.custom_fields ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup.business_user (LIKE public.business_user INCLUDING ALL);
INSERT INTO backup.business_user SELECT * FROM public.business_user ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup.programs (LIKE public.programs INCLUDING ALL);
INSERT INTO backup.programs SELECT * FROM public.programs ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS backup.templates (LIKE public.templates INCLUDING ALL);
INSERT INTO backup.templates SELECT * FROM public.templates ON CONFLICT DO NOTHING;

-- Helper map for migrating account->business FKs where needed
CREATE TABLE IF NOT EXISTS public.account_business_map (
  account_id uuid PRIMARY KEY,
  business_id uuid UNIQUE
);

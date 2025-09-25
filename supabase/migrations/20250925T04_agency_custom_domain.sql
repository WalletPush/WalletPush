-- 1) Add primary custom domain to agencies
alter table public.agency_accounts
  add column if not exists custom_domain text unique,
  add column if not exists custom_domain_status text
    default 'pending'
    check (custom_domain_status in ('pending','active','failed')),
  add column if not exists dns_configured boolean default false;

-- 2) Optional backfill from published sales pages
update public.agency_accounts a
set custom_domain = s.custom_domain,
    custom_domain_status = case when s.custom_domain is not null then 'active' else a.custom_domain_status end,
    dns_configured = case when s.custom_domain is not null then true else a.dns_configured end
from (
  select agency_account_id, custom_domain
  from public.agency_sales_pages
  where is_active = true and is_published = true and custom_domain is not null
  group by agency_account_id, custom_domain
  order by agency_account_id
) s
where a.id = s.agency_account_id
  and a.custom_domain is null;

-- 3) Index for active custom domains
create index if not exists agency_accounts_custom_domain_active_idx
  on public.agency_accounts (custom_domain)
  where custom_domain is not null and custom_domain_status = 'active';

-- Allow authenticated users to delete their own custom domains
-- Mirrors existing SELECT/INSERT/UPDATE policies

drop policy if exists "Users can delete domains for their business" on public.custom_domains;

create policy "Users can delete domains for their business"
  on public.custom_domains
  for delete
  to public
  using (
    (
      business_id in (
        select user_active_account.active_account_id
        from public.user_active_account
        where user_active_account.user_id = auth.uid()
      )
    )
    or (
      business_id in (
        select account_members.account_id
        from public.account_members
        where account_members.user_id = auth.uid()
      )
    )
  );



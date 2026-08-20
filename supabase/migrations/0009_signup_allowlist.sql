-- The closed-beta signup guard (0007) fired on admin-created users too:
-- GoTrue inserts users unconfirmed first regardless of email_confirm, so no
-- column distinguishes an admin invite from a self-signup at insert time.
-- Deterministic fix: the invite edge function pre-authorizes the exact email
-- in this table (service_role only; RLS on with no policies), and the guard
-- trigger allows the insert only when a fresh allowlist row exists.

create table if not exists public.farmkit_signup_allowlist (
  email text primary key,
  expires_at timestamptz not null
);

alter table public.farmkit_signup_allowlist enable row level security;

revoke all on public.farmkit_signup_allowlist from public;
revoke all on public.farmkit_signup_allowlist from anon;
revoke all on public.farmkit_signup_allowlist from authenticated;

create or replace function public.farmkit_block_self_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.farmkit_signup_allowlist
    where lower(email) = lower(new.email)
      and expires_at > now()
  ) then
    return new;
  end if;
  raise exception 'Farmkit is invite-only during beta. Ask a farm admin for an invite.';
end;
$$;

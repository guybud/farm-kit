-- Closed beta: accounts are created only via the admin invite flow
-- (generateLink type invite -> sets invited_at) or the Auth Admin API with
-- email_confirm (-> sets email_confirmed_at at insert). A self-service
-- signup arrives with neither, so reject it at the database regardless of
-- the dashboard "allow signups" toggle. Remove this trigger (and re-check
-- the dashboard setting) when opening the beta; note it also blocks OAuth
-- and anonymous sign-ins by design.

create or replace function public.farmkit_block_self_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.invited_at is null and new.email_confirmed_at is null then
    raise exception 'Farmkit is invite-only during beta. Ask a farm admin for an invite.';
  end if;
  return new;
end;
$$;

revoke execute on function public.farmkit_block_self_signup() from public;
revoke execute on function public.farmkit_block_self_signup() from anon;
revoke execute on function public.farmkit_block_self_signup() from authenticated;

drop trigger if exists farmkit_block_self_signup on auth.users;
create trigger farmkit_block_self_signup
  before insert on auth.users
  for each row execute function public.farmkit_block_self_signup();

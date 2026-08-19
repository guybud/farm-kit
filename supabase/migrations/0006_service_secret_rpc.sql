-- farmkit_service_secret: lets edge functions (service_role) read secrets from
-- Supabase Vault via REST RPC, since the vault schema is not exposed over
-- PostgREST. Secrets themselves are inserted out-of-band with
-- vault.create_secret(); never put secret values in migrations.

create or replace function public.farmkit_service_secret(secret_name text)
returns text
language sql
security definer
set search_path = public, pg_temp
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
  limit 1;
$$;

revoke execute on function public.farmkit_service_secret(text) from public;
revoke execute on function public.farmkit_service_secret(text) from anon;
revoke execute on function public.farmkit_service_secret(text) from authenticated;
grant execute on function public.farmkit_service_secret(text) to service_role;

-- Server-side-only accessor: lets edge functions (service role) read named Vault secrets.
-- Never callable by anon/authenticated.
create or replace function public.internal_get_secret(secret_name text)
returns text
language sql
security definer
set search_path = vault, pg_temp
as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name;
$$;

revoke all on function public.internal_get_secret(text) from public;
revoke all on function public.internal_get_secret(text) from anon;
revoke all on function public.internal_get_secret(text) from authenticated;
grant execute on function public.internal_get_secret(text) to service_role;

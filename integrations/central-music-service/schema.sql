begin;
create schema if not exists music_private;
revoke all on schema music_private from public, anon, authenticated;
create table public.music_projects (
  slug text primary key check (slug ~ '^[a-z][a-z0-9-]{1,47}$'),
  owner_id uuid not null references auth.users(id),
  display_name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.music_projects enable row level security;
revoke all on public.music_projects from anon, authenticated;
grant select on public.music_projects to authenticated;
create policy music_projects_owner_read on public.music_projects for select to authenticated using (owner_id=(select auth.uid()));
create table public.music_references (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null references public.music_projects(slug),
  provider text not null default 'tidal' check (provider='tidal'),
  entity_type text not null default 'playlist' check (entity_type='playlist'),
  entity_id text not null check (entity_id ~ '^[A-Za-z0-9_-]{6,128}$'),
  notes text not null default '' check (length(notes)<=10000),
  created_at timestamptz not null default now(),
  unique(project_slug,provider,entity_type,entity_id)
);
alter table public.music_references enable row level security;
revoke all on public.music_references from anon, authenticated;
grant select on public.music_references to authenticated;
create policy music_references_owner_read on public.music_references for select to authenticated using
 (exists(select 1 from public.music_projects p where p.slug=project_slug and p.owner_id=(select auth.uid())));
create table music_private.clients (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  project_slug text not null references public.music_projects(slug),
  enabled boolean not null default true,
  minute_start timestamptz not null default now(),
  requests integer not null default 0
);
create table music_private.session (
  singleton boolean primary key default true check(singleton),
  secret_id uuid not null references vault.secrets(id),
  lease_id uuid, lease_until timestamptz,
  next_request_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table music_private.clients enable row level security;
alter table music_private.session enable row level security;
create policy music_clients_no_direct_access on music_private.clients for all to public using(false) with check(false);
create policy music_session_no_direct_access on music_private.session for all to public using(false) with check(false);
create index music_projects_owner_id_idx on public.music_projects(owner_id);
revoke all on all tables in schema music_private from public,anon,authenticated;

create function public.music_authorize_client(p_hash text,p_project text) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update music_private.clients c set
   requests=case when c.minute_start<date_trunc('minute',clock_timestamp()) then 1 else c.requests+1 end,
   minute_start=date_trunc('minute',clock_timestamp())
 where c.token_hash=p_hash and c.project_slug=p_project and c.enabled
 and exists(select 1 from public.music_projects p where p.slug=p_project and p.enabled)
 and (c.minute_start<date_trunc('minute',clock_timestamp()) or c.requests<30);
 get diagnostics n=row_count;
 return n=1;
end $$;

create function public.music_initialize_session(p_session jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 perform pg_advisory_xact_lock(709113824);
 if exists(select 1 from music_private.session) then return false; end if;
 if jsonb_typeof(p_session)<>'object' or length(coalesce(p_session->>'access_token',''))<10
 or length(coalesce(p_session->>'refresh_token',''))<10 or coalesce(p_session->>'client_id','')='' then
 raise exception 'Invalid session'; end if;
 if (p_session->>'scope') is distinct from 'playlists.read collection.read' and
    (p_session->>'scope') is distinct from 'collection.read playlists.read' then raise exception 'Read scopes required'; end if;
 sid:=vault.create_secret(p_session::text,'music_tidal_session','Private central read-only music service');
 insert into music_private.session(singleton,secret_id) values(true,sid);
 return true;
end $$;

create function public.music_session_checkout(p_lease uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 update music_private.session set lease_id=p_lease,lease_until=clock_timestamp()+interval '90 seconds'
 where singleton and (lease_until is null or lease_until<clock_timestamp())
 and next_request_at<=clock_timestamp() returning secret_id into sid;
 if sid is null then return null; end if;
 return (select decrypted_secret::jsonb from vault.decrypted_secrets where id=sid);
end $$;

create function public.music_session_save(p_lease uuid,p_session jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 select secret_id into sid from music_private.session where singleton and lease_id=p_lease and lease_until>clock_timestamp() for update;
 if sid is null then return false; end if;
 if coalesce(p_session->>'client_id','')='' or length(coalesce(p_session->>'refresh_token',''))<10 then raise exception 'Invalid session'; end if;
 perform vault.update_secret(sid,p_session::text);
 update music_private.session set updated_at=clock_timestamp() where singleton;
 return true;
end $$;

create function public.music_session_release(p_lease uuid,p_cooldown integer default 2) returns void
language sql security definer set search_path='' as $$
 update music_private.session set lease_id=null,lease_until=null,
 next_request_at=clock_timestamp()+make_interval(secs=>greatest(2,least(p_cooldown,60))) where singleton and lease_id=p_lease;
$$;

revoke all on function public.music_authorize_client(text,text),public.music_initialize_session(jsonb),
 public.music_session_checkout(uuid),public.music_session_save(uuid,jsonb),public.music_session_release(uuid,integer)
 from public,anon,authenticated;
grant execute on function public.music_authorize_client(text,text),public.music_initialize_session(jsonb),
 public.music_session_checkout(uuid),public.music_session_save(uuid,jsonb),public.music_session_release(uuid,integer)
 to service_role;
-- Seed project owners and reference IDs through the authenticated operator separately.
commit;

begin;
create schema music_sync_private;
revoke all on schema music_sync_private from public,anon,authenticated;
create table music_sync_private.state(key text primary key,secret_id uuid not null references vault.secrets(id),updated_at timestamptz not null default now());
create table music_sync_private.lock(singleton boolean primary key check(singleton),lease uuid,until_at timestamptz);
insert into music_sync_private.lock(singleton) values(true);
alter table music_sync_private.state enable row level security;
alter table music_sync_private.lock enable row level security;
create policy music_sync_state_deny on music_sync_private.state for all to public using(false) with check(false);
create policy music_sync_lock_deny on music_sync_private.lock for all to public using(false) with check(false);
revoke all on all tables in schema music_sync_private from public,anon,authenticated;
create function public.music_youtube_load(p_key text) returns jsonb language sql security definer set search_path='' as $$
 select d.decrypted_secret::jsonb from music_sync_private.state s join vault.decrypted_secrets d on d.id=s.secret_id where s.key=p_key;
$$;
create function public.music_youtube_store(p_key text,p_value jsonb) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if p_key!~'^[a-z0-9:_-]{1,128}$' then raise exception 'Invalid state key';end if;
 perform pg_advisory_xact_lock(709113825);
 select secret_id into sid from music_sync_private.state where key=p_key for update;
 if sid is null then
 sid:=vault.create_secret(p_value::text,'music_sync_'||p_key,'Private music sync state');
 insert into music_sync_private.state(key,secret_id) values(p_key,sid);
 else
 perform vault.update_secret(sid,p_value::text);
 update music_sync_private.state set updated_at=now() where key=p_key;
 end if;
end $$;
create function public.music_youtube_lock(p_lease uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update music_sync_private.lock set lease=p_lease,until_at=now()+interval '90 seconds' where singleton and (until_at is null or until_at<now());
 get diagnostics n=row_count;return n=1;
end $$;
create function public.music_youtube_unlock(p_lease uuid) returns void language sql security definer set search_path='' as $$
 update music_sync_private.lock set lease=null,until_at=null where singleton and lease=p_lease;
$$;
revoke all on function public.music_youtube_load(text),public.music_youtube_store(text,jsonb),public.music_youtube_lock(uuid),public.music_youtube_unlock(uuid) from public,anon,authenticated;
grant execute on function public.music_youtube_load(text),public.music_youtube_store(text,jsonb),public.music_youtube_lock(uuid),public.music_youtube_unlock(uuid) to service_role;
commit;

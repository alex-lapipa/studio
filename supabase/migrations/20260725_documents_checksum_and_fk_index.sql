-- Applied 2026-07-25 as migration `documents_checksum_and_fk_index`.
-- Additive only: new nullable column + two new indexes. No existing rows modified by the DDL.
alter table public.documents add column if not exists checksum text;
comment on column public.documents.checksum is 'sha256 hex of the bucket object at source_bucket/source_path. Null for web_research docs with no bucket object.';
create index if not exists documents_gear_id_idx on public.documents (gear_id);
create index if not exists documents_checksum_idx on public.documents (checksum);

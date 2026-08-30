-- Backfill deterministic document → gear graph edges from the existing documents.gear_id FK.
-- Additive and idempotent: no source rows are changed or deleted.
insert into public.document_entities (document_id, entity_type, entity_id, relationship)
select d.id, 'gear', d.gear_id::text, 'about'
from public.documents d
where d.gear_id is not null
on conflict (document_id, entity_type, entity_id, relationship) do nothing;

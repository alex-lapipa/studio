create extension if not exists vector with schema extensions;

-- One row per piece of studio hardware
create table public.gear (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  category text not null,
  synthesis_type text,
  role_in_studio text,
  midi_channels text,
  sync_capabilities text,
  io_summary text,
  notes text,
  created_at timestamptz not null default now(),
  unique (make, model)
);

-- One row per source document (bucket file or web research)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  gear_id uuid references public.gear(id),
  title text not null,
  doc_type text not null, -- manual | patch_sheet | patch_book | sync_guide | web_research
  source_bucket text,
  source_path text,
  source_url text,
  pages int,
  status text not null default 'pending',
  ingested_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_bucket, source_path)
);

-- Chunked, embedded content
create table public.chunks (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  section text,
  page_start int,
  page_end int,
  embedding extensions.vector(384),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  unique (document_id, chunk_index)
);

create index chunks_embedding_idx on public.chunks using hnsw (embedding extensions.vector_cosine_ops);
create index chunks_fts_idx on public.chunks using gin (fts);
create index chunks_document_idx on public.chunks (document_id);

-- Hybrid search: reciprocal rank fusion of semantic + keyword
create or replace function public.search_knowledge(
  query_text text,
  query_embedding extensions.vector(384),
  match_count int default 8,
  filter_gear uuid default null
)
returns table (
  chunk_id bigint, document_id uuid, document_title text, doc_type text,
  gear text, section text, page_start int, content text, score double precision
)
language sql stable
set search_path = public, extensions
as $$
with semantic as (
  select c.id, row_number() over (order by c.embedding <=> query_embedding) as rank
  from chunks c join documents d on d.id = c.document_id
  where c.embedding is not null and (filter_gear is null or d.gear_id = filter_gear)
  order by c.embedding <=> query_embedding
  limit match_count * 4
),
keyword as (
  select c.id, row_number() over (order by ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) desc) as rank
  from chunks c join documents d on d.id = c.document_id
  where c.fts @@ websearch_to_tsquery('english', query_text)
    and (filter_gear is null or d.gear_id = filter_gear)
  limit match_count * 4
),
fused as (
  select coalesce(s.id, k.id) as id,
         coalesce(1.0 / (60 + s.rank), 0) + coalesce(1.0 / (60 + k.rank), 0) as score
  from semantic s full outer join keyword k on s.id = k.id
)
select c.id, d.id, d.title, d.doc_type,
       coalesce(g.make || ' ' || g.model, 'general'),
       c.section, c.page_start, c.content, f.score
from fused f
join chunks c on c.id = f.id
join documents d on d.id = c.document_id
left join gear g on g.id = d.gear_id
order by f.score desc
limit match_count;
$$;

alter table public.gear enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;

create policy "authenticated read gear" on public.gear for select to authenticated using (true);
create policy "authenticated read documents" on public.documents for select to authenticated using (true);
create policy "authenticated read chunks" on public.chunks for select to authenticated using (true);

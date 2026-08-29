-- Studio Source of Truth v2 (additive / backward compatible)
-- Designed to leave gear/documents/chunks/search_knowledge consumers operational.

create table if not exists public.computers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hostname text,
  platform text not null,
  architecture text,
  hardware_model text,
  memory_bytes bigint,
  os_version text,
  os_build text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.software (
  id uuid primary key default gen_random_uuid(),
  computer_id uuid references public.computers(id) on delete cascade,
  vendor text,
  name text not null,
  version text,
  category text,
  bundle_id text,
  install_path text,
  observed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (computer_id, name, version)
);

create table if not exists public.plugins (
  id uuid primary key default gen_random_uuid(),
  computer_id uuid references public.computers(id) on delete cascade,
  vendor text,
  name text not null,
  version text,
  format text not null,
  path text,
  observed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (computer_id, name, version, format)
);

create table if not exists public.endpoints (
  id uuid primary key default gen_random_uuid(),
  computer_id uuid references public.computers(id) on delete set null,
  gear_id uuid references public.gear(id) on delete set null,
  endpoint_type text not null check (endpoint_type in ('midi','audio','usb','network','other')),
  name text not null,
  direction text check (direction in ('input','output','bidirectional','unknown')),
  transport text,
  channels_in int,
  channels_out int,
  sample_rate_hz numeric,
  is_default_input boolean,
  is_default_output boolean,
  observed_at timestamptz,
  active boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists endpoints_computer_idx on public.endpoints(computer_id);
create index if not exists endpoints_gear_idx on public.endpoints(gear_id);
create index if not exists endpoints_type_idx on public.endpoints(endpoint_type);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  source_endpoint_id uuid references public.endpoints(id) on delete cascade,
  destination_endpoint_id uuid references public.endpoints(id) on delete cascade,
  connection_type text not null check (connection_type in ('midi','audio','cv','clock','usb','network','other')),
  status text not null default 'planned' check (status in ('planned','configured','observed','inactive')),
  channel_map text,
  notes text,
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  check (source_endpoint_id is distinct from destination_endpoint_id)
);

create index if not exists connections_source_idx on public.connections(source_endpoint_id);
create index if not exists connections_destination_idx on public.connections(destination_endpoint_id);

create table if not exists public.observations (
  id bigint generated always as identity primary key,
  observed_at timestamptz not null default now(),
  observer text not null,
  evidence_type text not null check (evidence_type in ('live_observation','manufacturer_documentation','saved_configuration','inference')),
  entity_type text not null,
  entity_id text,
  fact_key text not null,
  fact_value jsonb not null,
  source_document_id uuid references public.documents(id) on delete set null,
  source_ref text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists observations_entity_idx on public.observations(entity_type, entity_id, fact_key);
create index if not exists observations_time_idx on public.observations(observed_at desc);

create table if not exists public.document_entities (
  document_id uuid not null references public.documents(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  relationship text not null default 'about',
  created_at timestamptz not null default now(),
  primary key (document_id, entity_type, entity_id, relationship)
);

alter table public.computers enable row level security;
alter table public.software enable row level security;
alter table public.plugins enable row level security;
alter table public.endpoints enable row level security;
alter table public.connections enable row level security;
alter table public.observations enable row level security;
alter table public.document_entities enable row level security;

create policy "authenticated read computers" on public.computers for select to authenticated using (true);
create policy "authenticated read software" on public.software for select to authenticated using (true);
create policy "authenticated read plugins" on public.plugins for select to authenticated using (true);
create policy "authenticated read endpoints" on public.endpoints for select to authenticated using (true);
create policy "authenticated read connections" on public.connections for select to authenticated using (true);
create policy "authenticated read observations" on public.observations for select to authenticated using (true);
create policy "authenticated read document_entities" on public.document_entities for select to authenticated using (true);

-- Writes intentionally have no authenticated policies in phase 1.
-- Administrative ingestion continues through trusted server-side/service-role paths.

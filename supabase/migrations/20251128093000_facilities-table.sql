-- Migration: facilities-table
-- Creates facilities (POIs) with RLS, indexes, and updated_at trigger

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  building_id uuid references public.buildings(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facilities_type_check check (
    type in (
      'admin', 'registrar', 'cashier', 'ict', 'lab', 'library', 'dorm', 'canteen', 'clinic',
      'cr', 'court', 'gym', 'oval', 'stage', 'printing', 'water', 'gate', 'parking', 'office', 'classroom'
    )
  )
);

comment on table public.facilities is 'Non-building points of interest (admin, CR, courts, gates, parking, etc.)';

-- Indexes
create index if not exists facilities_type_idx on public.facilities (type);
create index if not exists facilities_is_active_idx on public.facilities (is_active);
create index if not exists facilities_building_id_idx on public.facilities (building_id);
create index if not exists facilities_latitude_longitude_idx on public.facilities (latitude, longitude);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_facilities_updated_at on public.facilities;
create trigger set_facilities_updated_at
before update on public.facilities
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.facilities enable row level security;

-- Public read of active facilities
drop policy if exists "Public read facilities" on public.facilities;
create policy "Public read facilities"
  on public.facilities
  for select
  using (is_active = true);

-- Admin read all facilities (including inactive)
drop policy if exists "Admin read facilities" on public.facilities;
create policy "Admin read facilities"
  on public.facilities
  for select
  using (auth.role() = 'admin');

-- Admin manage facilities
drop policy if exists "Admin manage facilities" on public.facilities;
create policy "Admin manage facilities"
  on public.facilities
  for all
  using (auth.role() = 'admin')
  with check (auth.role() = 'admin');

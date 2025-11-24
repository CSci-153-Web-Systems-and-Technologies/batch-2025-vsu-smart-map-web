-- Migration: buildings-table
-- Creates buildings table with basic RLS (public read, authenticated write)

-- Enum for building categories (matches lib/constants/buildings.ts)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'building_category') then
    create type public.building_category as enum (
      'ACADEMIC',
      'ADMINISTRATIVE',
      'DORMITORY',
      'SERVICE',
      'SPORTS',
      'LABORATORY'
    );
  end if;
end$$;

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category public.building_category not null,
  email text,
  phone text,
  facebook text,
  website text,
  hero_image_url text,
  hero_image_alt text,
  lat double precision not null default 10.74450,
  lng double precision not null default 124.79194,
  address text,
  tags text[],
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.buildings is 'Campus buildings with location, contact info, and metadata';

-- Basic indexes
create index if not exists buildings_category_idx on public.buildings (category);
create index if not exists buildings_name_trgm_idx on public.buildings using gin (name gin_trgm_ops);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_buildings_updated_at on public.buildings;
create trigger set_buildings_updated_at
before update on public.buildings
for each row execute procedure public.set_updated_at();

-- RLS policies
alter table public.buildings enable row level security;

-- Public read
drop policy if exists "Public read buildings" on public.buildings;
create policy "Public read buildings"
  on public.buildings
  for select
  using (true);

-- Authenticated write (tighten to admin claim later)
drop policy if exists "Authenticated write buildings" on public.buildings;
create policy "Authenticated write buildings"
  on public.buildings
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
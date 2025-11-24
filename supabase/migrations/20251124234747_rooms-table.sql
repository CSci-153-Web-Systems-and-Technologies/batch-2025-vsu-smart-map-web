-- Migration: rooms-table
-- Creates rooms table with RLS (public read, authenticated write)

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  room_code text not null,
  name text,
  description text,
  floor integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_building_room_code_unique unique (building_id, room_code)
);

comment on table public.rooms is 'Rooms within campus buildings';

-- Indexes
create index if not exists rooms_building_id_idx on public.rooms (building_id);
create index if not exists rooms_room_code_idx on public.rooms (room_code);

-- Updated_at trigger helper (reuses set_updated_at from buildings migration)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.rooms enable row level security;

drop policy if exists "Public read rooms" on public.rooms;
create policy "Public read rooms"
  on public.rooms
  for select
  using (true);

drop policy if exists "Authenticated write rooms" on public.rooms;
create policy "Authenticated write rooms"
  on public.rooms
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
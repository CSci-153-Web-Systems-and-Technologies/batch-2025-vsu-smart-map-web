-- Migration: database-indexes-and-triggers
-- Adds targeted indexes for common query paths and reapplies updated_at triggers

-- Enable trigram support for ILIKE searches (safe if already installed)
create extension if not exists pg_trgm;

-- Shared updated_at helper for all tables
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Buildings indexes
create index if not exists buildings_code_trgm_idx on public.buildings using gin (code gin_trgm_ops);
create index if not exists buildings_category_featured_updated_idx on public.buildings (category, is_featured, updated_at desc);
create index if not exists buildings_tags_gin_idx on public.buildings using gin (tags);

-- Ensure updated_at trigger is present on buildings
drop trigger if exists set_buildings_updated_at on public.buildings;
create trigger set_buildings_updated_at
before update on public.buildings
for each row execute procedure public.set_updated_at();

-- Rooms indexes
create index if not exists rooms_room_code_trgm_idx on public.rooms using gin (room_code gin_trgm_ops);

-- Ensure updated_at trigger is present on rooms
drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute procedure public.set_updated_at();

-- Submissions indexes
create index if not exists submissions_status_created_at_idx on public.submissions (status, created_at desc);

-- Ensure updated_at trigger is present on submissions
drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row execute procedure public.set_updated_at();

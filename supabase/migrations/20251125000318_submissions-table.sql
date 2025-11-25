-- Migration: submissions-table
-- Creates submissions table with RLS (public insert/select, authenticated update/delete placeholder)

-- Enum for submission status (matches lib/constants/status.ts)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
end$$;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references public.buildings(id) on delete set null,
  building_name text not null,
  location_description text,
  additional_info text,
  submitter_name text,
  submitter_email text,
  status public.submission_status not null default 'PENDING',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.submissions is 'Public submissions for new or corrected building info';

-- Indexes
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_building_id_idx on public.submissions (building_id);
create index if not exists submissions_created_at_idx on public.submissions (created_at);

-- Updated_at trigger helper (reuses set_updated_at)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.submissions enable row level security;

-- Public can insert and read their own submission (simplified to public read for now)
drop policy if exists "Public read submissions" on public.submissions;
create policy "Public read submissions"
  on public.submissions
  for select
  using (true);

drop policy if exists "Public insert submissions" on public.submissions;
create policy "Public insert submissions"
  on public.submissions
  for insert
  with check (true);

-- Authenticated write (tighten to admin later)
drop policy if exists "Authenticated write submissions" on public.submissions;
create policy "Authenticated write submissions"
  on public.submissions
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated delete submissions" on public.submissions;
create policy "Authenticated delete submissions"
  on public.submissions
  for delete
  using (auth.role() = 'authenticated');

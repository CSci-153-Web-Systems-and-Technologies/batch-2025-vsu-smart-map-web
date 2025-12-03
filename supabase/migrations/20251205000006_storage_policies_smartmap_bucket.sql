-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('Smartmap_Bucket', 'Smartmap_Bucket', true)
on conflict (id) do update set public = true;

-- Public read access for Smartmap_Bucket
create policy "Public read Smartmap_Bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'Smartmap_Bucket');

-- Remove overly broad policy if it exists
drop policy if exists "Authenticated manage Smartmap_Bucket" on storage.objects;

-- Authenticated users can upload their own files
create policy "Authenticated upload Smartmap_Bucket"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'Smartmap_Bucket' and owner = auth.uid());

-- Authenticated users can update their own files
create policy "Authenticated update Smartmap_Bucket"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'Smartmap_Bucket' and owner = auth.uid())
  with check (bucket_id = 'Smartmap_Bucket' and owner = auth.uid());

-- Authenticated users can delete their own files
create policy "Authenticated delete Smartmap_Bucket"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'Smartmap_Bucket' and owner = auth.uid());

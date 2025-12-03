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

-- Authenticated users can manage Smartmap_Bucket
create policy "Authenticated manage Smartmap_Bucket"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'Smartmap_Bucket')
  with check (bucket_id = 'Smartmap_Bucket');

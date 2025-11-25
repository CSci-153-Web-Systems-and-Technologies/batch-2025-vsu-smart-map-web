# Storage Bucket – building-images

## Bucket
- Name: `building-images`
- Visibility: Public read (for map/directory images)
- Writes: Restricted to authenticated/admin or service role

## Policies (Dashboard)
- Select: allow anon/public
- Insert/Update/Delete: allow authenticated/admin only (tighten via JWT `is_admin` later)

## File rules
- Allowed types: image/png, image/jpeg, image/webp
- Max size: 5 MB
- Folder convention:
  - `building-images/{buildingId}/hero/<filename>`
  - `building-images/{buildingId}/rooms/{roomId}/<filename>`

## Usage notes
- Use Supabase Storage API; for private mode, generate signed URLs.
- CDN/cache: purge if replacing hero images.
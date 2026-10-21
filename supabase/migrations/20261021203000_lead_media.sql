-- Private bucket for enquiry photos and videos.
-- anon can INSERT only. No select, update, or delete policy is created,
-- so the public site can upload files but cannot read, list, or remove them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-media',
  'lead-media',
  false,
  52428800, -- 50 MB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anon can upload lead media" on storage.objects;

create policy "Anon can upload lead media"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'lead-media');

alter table quote_leads
  add column if not exists media_paths text[];

alter table trade_leads
  add column if not exists media_paths text[];

notify pgrst, 'reload schema';

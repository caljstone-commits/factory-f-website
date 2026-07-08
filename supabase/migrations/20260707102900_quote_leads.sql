create table quote_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  phone text not null,
  email text,
  car_reg text,
  postcode text,
  wheel_size text,
  service_type text,
  message text,
  source_page text
);

alter table quote_leads enable row level security;

create policy "Allow public insert only"
  on quote_leads
  for insert
  to anon
  with check (true);

-- Explicitly no SELECT/UPDATE/DELETE policy for anon,
-- so the public can submit leads but never read, edit, or delete them.

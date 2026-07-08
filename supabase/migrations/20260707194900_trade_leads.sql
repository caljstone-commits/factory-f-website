create table trade_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company_name text not null,
  postcode text,
  business_type text,
  commitment text,
  est_wheels_per_week text,
  contact_number text not null,
  email text,
  source_page text
);

alter table trade_leads enable row level security;

create policy "Allow anon insert"
  on trade_leads
  for insert
  to anon
  with check (true);

grant insert on trade_leads to anon;

notify pgrst, 'reload schema';

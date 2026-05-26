-- Leads & provider claims

-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  treatment_area text not null,
  preferred_provider text,
  provider_id uuid references providers(id) on delete set null,
  city text,
  state_code text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index leads_created_at_idx on leads (created_at desc);
create index leads_city_state_code_idx on leads (city, state_code);
create index leads_status_idx on leads (status);

-- provider_claims
create table provider_claims (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete set null,
  provider_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  role text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index provider_claims_provider_id_idx on provider_claims (provider_id);
create index provider_claims_status_idx on provider_claims (status);

-- RLS: writable by anon, NOT readable by anon (service_role bypasses)
alter table leads enable row level security;
alter table provider_claims enable row level security;

create policy "Anon can insert leads"
  on leads for insert
  to anon
  with check (true);

create policy "Anon can insert provider claims"
  on provider_claims for insert
  to anon
  with check (true);
-- Note: no SELECT/UPDATE/DELETE policies granted to anon, so only the
-- service role (used by an admin tool or dashboard) can read these tables.

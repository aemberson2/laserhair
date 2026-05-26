-- Neighborhoods

create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text not null,
  city_slug text not null,
  state_code text not null,
  state_slug text not null,
  latitude decimal not null,
  longitude decimal not null,
  radius_km decimal not null default 5,
  provider_count integer not null default 0,
  avg_rating decimal,
  created_at timestamptz not null default now()
);

create index neighborhoods_city_slug_idx on neighborhoods (city_slug);
create index neighborhoods_state_slug_idx on neighborhoods (state_slug);
create index neighborhoods_slug_idx on neighborhoods (slug);

alter table neighborhoods enable row level security;

create policy "Public read access on neighborhoods"
  on neighborhoods for select
  to anon
  using (true);
-- No INSERT/UPDATE/DELETE policies — only service role can mutate.

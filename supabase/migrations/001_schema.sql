-- Laser Directory schema

create extension if not exists "pgcrypto";

-- providers
create table providers (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique not null,
  name text not null,
  slug text unique not null,
  phone text,
  website text,
  address text,
  street text,
  city text,
  county text,
  state text,
  state_code text,
  postal_code text,
  latitude decimal,
  longitude decimal,
  timezone text,
  rating decimal,
  review_count integer default 0,
  reviews_1 integer default 0,
  reviews_2 integer default 0,
  reviews_3 integer default 0,
  reviews_4 integer default 0,
  reviews_5 integer default 0,
  photo_count integer default 0,
  photo_url text,
  logo_url text,
  subtypes text[],
  category text,
  business_status text,
  working_hours jsonb,
  booking_url text,
  about jsonb,
  is_verified boolean default false,
  is_laser_specialist boolean default false,
  google_maps_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- cities
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  state_code text not null,
  slug text unique not null,
  provider_count integer default 0,
  avg_rating decimal,
  latitude decimal,
  longitude decimal,
  constraint cities_name_state_code_key unique (name, state_code)
);

-- states
create table states (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  slug text unique not null,
  provider_count integer default 0,
  city_count integer default 0
);

-- indexes
create index providers_city_state_code_idx on providers (city, state_code);
create index providers_state_code_idx on providers (state_code);
create index providers_slug_idx on providers (slug);
create index providers_rating_review_count_idx on providers (rating desc, review_count desc);
create index cities_state_code_idx on cities (state_code);
create index cities_slug_idx on cities (slug);
create index states_slug_idx on states (slug);

-- row level security: public read
alter table providers enable row level security;
alter table cities enable row level security;
alter table states enable row level security;

create policy "Public read access on providers"
  on providers for select
  to anon
  using (true);

create policy "Public read access on cities"
  on cities for select
  to anon
  using (true);

create policy "Public read access on states"
  on states for select
  to anon
  using (true);

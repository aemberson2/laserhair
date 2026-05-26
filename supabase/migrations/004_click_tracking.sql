-- Provider click tracking

create table provider_clicks (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  click_type text not null check (click_type in ('website', 'booking', 'call', 'quote', 'directions')),
  city text,
  state_code text,
  referrer_page text,
  created_at timestamptz not null default now()
);

create index provider_clicks_provider_id_idx on provider_clicks (provider_id);
create index provider_clicks_created_at_idx on provider_clicks (created_at desc);
create index provider_clicks_click_type_idx on provider_clicks (click_type);

alter table provider_clicks enable row level security;

create policy "Anon can insert provider clicks"
  on provider_clicks for insert
  to anon
  with check (true);
-- No SELECT/UPDATE/DELETE policies granted to anon. Only the service role
-- can read or aggregate clicks (e.g. for the provider analytics dashboard).

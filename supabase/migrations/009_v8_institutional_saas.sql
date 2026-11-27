-- CampusMate V8: Institution-Funded EdTech SaaS, Licensing, Housing & Sponsorships

create table if not exists public.institutional_plans (
  code text primary key,
  name text not null,
  student_seat_price_tnd numeric not null,
  professor_seat_price_tnd numeric not null,
  ai_monthly_allowance_per_seat integer not null default 20000,
  storage_limit_gb integer not null default 50,
  automation_limit integer not null default 2,
  min_contract_tnd numeric not null default 2500,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_licenses (
  id text primary key,
  institution_id uuid not null,
  plan_code text not null references public.institutional_plans(code),
  status text not null check (status in ('requested','under_review','quotation_issued','contract_pending','active','renewal_pending','expired','suspended')),
  start_date date not null,
  expiration_date date not null,
  max_student_seats integer not null,
  max_professor_seats integer not null,
  assigned_student_seats integer not null default 0,
  assigned_professor_seats integer not null default 0,
  ai_monthly_allowance integer not null,
  ai_used_this_period integer not null default 0,
  storage_limit_gb integer not null default 50,
  storage_used_gb numeric not null default 0,
  annual_contract_tnd numeric not null,
  sponsorships_enabled boolean not null default true,
  is_simulated boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.license_seat_allocations (
  id text primary key,
  license_id text not null references public.institution_licenses(id) on delete cascade,
  institution_id uuid not null,
  user_id text not null,
  seat_type text not null check (seat_type in ('student','teacher')),
  status text not null check (status in ('assigned','released')),
  assigned_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists idx_unique_active_seat
  on public.license_seat_allocations(institution_id, user_id)
  where status = 'assigned';

create table if not exists public.institutional_quotes (
  id text primary key,
  institution_name text not null,
  institution_type text not null,
  official_website text,
  contact_name text not null,
  contact_email text not null,
  plan_code text not null,
  student_seats integer not null,
  professor_seats integer not null,
  onboarding_service_tnd numeric not null default 0,
  discount_percent numeric not null default 0,
  annual_total_tnd numeric not null,
  monthly_equivalent_tnd numeric not null,
  status text not null default 'requested',
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.housing_providers (
  id text primary key,
  user_id text,
  name text not null,
  contact_email text not null,
  verification_status text not null check (verification_status in ('pending','verified','rejected')),
  plan_code text not null,
  plan_price_tnd numeric not null,
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.housing_listings (
  id text primary key,
  provider_id text not null references public.housing_providers(id) on delete cascade,
  institution_id uuid not null,
  title text not null,
  description text not null,
  category text not null,
  general_location text not null,
  monthly_rent_tnd numeric not null,
  distance_km numeric not null default 1,
  available boolean not null default true,
  amenities jsonb not null default '[]'::jsonb,
  lease_duration text not null,
  included_expenses text not null,
  photos jsonb not null default '[]'::jsonb,
  is_verified_provider boolean not null default false,
  is_sponsored boolean not null default false,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.educational_partners (
  id text primary key,
  user_id text,
  name text not null,
  website text not null,
  verification_status text not null check (verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.sponsorship_campaigns (
  id text primary key,
  partner_id text not null references public.educational_partners(id) on delete cascade,
  institution_id uuid,
  title text not null,
  description text not null,
  category text not null,
  certification_info text,
  destination_url text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending_review',
  impressions integer not null default 0,
  clicks integer not null default 0,
  annual_package_tnd numeric not null default 0,
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.institution_licenses enable row level security;
alter table public.license_seat_allocations enable row level security;
alter table public.institutional_quotes enable row level security;
alter table public.housing_providers enable row level security;
alter table public.housing_listings enable row level security;
alter table public.educational_partners enable row level security;
alter table public.sponsorship_campaigns enable row level security;

create policy "Approved housing listings are publicly readable"
  on public.housing_listings for select
  using (moderation_status = 'approved');

create policy "Approved sponsorship campaigns are publicly readable"
  on public.sponsorship_campaigns for select
  using (status = 'approved');

-- CampusMate V9: Social Campus Feed, Clubs & University Connect

create table if not exists public.social_posts (
  id text primary key,
  institution_id uuid not null,
  author_id text not null,
  author_name text not null,
  author_role text not null,
  post_type text not null check (post_type in ('post','question','announcement','project_showcase','club_update')),
  title text,
  content text not null,
  source_url text,
  source_attribution text,
  related_href text,
  is_pinned boolean not null default false,
  likes_user_ids jsonb not null default '[]'::jsonb,
  bookmarked_user_ids jsonb not null default '[]'::jsonb,
  moderation_status text not null default 'approved' check (moderation_status in ('approved','pending','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_comments (
  id text primary key,
  post_id text not null references public.social_posts(id) on delete cascade,
  author_id text not null,
  author_name text not null,
  author_role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_profiles (
  id text primary key,
  institution_id uuid not null,
  name text not null,
  category text not null,
  description text not null,
  contact_email text not null,
  is_verified boolean not null default false,
  member_ids jsonb not null default '[]'::jsonb,
  upcoming_activity text,
  created_at timestamptz not null default now()
);

create table if not exists public.external_source_connections (
  id text primary key,
  institution_id uuid not null,
  name text not null,
  source_type text not null check (source_type in ('official_website','facebook_page','public_feed','club_page')),
  source_url text not null,
  connection_status text not null check (connection_status in ('active','manual_import_only','pending_authorization')),
  last_synced_at timestamptz,
  last_summary text
);

create index if not exists idx_social_posts_inst on public.social_posts(institution_id, created_at desc);
create index if not exists idx_club_profiles_inst on public.club_profiles(institution_id);

alter table public.social_posts enable row level security;
alter table public.social_comments enable row level security;
alter table public.club_profiles enable row level security;
alter table public.external_source_connections enable row level security;

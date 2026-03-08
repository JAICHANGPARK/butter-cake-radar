create extension if not exists pgcrypto;

create table if not exists regions (
  id text primary key,
  sido text not null,
  sigungu text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text not null,
  address text not null,
  sido text not null,
  sigungu text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  opening_hours text,
  website_url text,
  instagram_url text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  disabled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists store_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, sort_order)
);

create table if not exists store_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  report_type text not null check (report_type in ('wrong_info', 'closed', 'duplicate', 'other')),
  note text not null,
  reporter_name text,
  reporter_contact text,
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  resolution text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists stores_region_idx on stores (sido, sigungu);
create index if not exists stores_status_idx on stores (status);
create index if not exists store_reports_store_status_idx on store_reports (store_id, status);
create index if not exists store_reports_created_idx on store_reports (created_at desc);

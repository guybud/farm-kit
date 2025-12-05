-- Farm Kit initial schema
-- Tables: locations, equipment, app_users, maintenance_logs

-- Ensure uuid generation
create extension if not exists "pgcrypto";

-- locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  farm_name text,
  notes text
);

-- equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.locations(id) on delete set null,
  category text not null,
  make text,
  model text,
  nickname text,
  serial_number text,
  year integer,
  unit_number text,
  vin_sn text,
  year_of_purchase integer,
  license_class text,
  next_service_at date,
  cvip_expires_at date,
  insurance_expires_at date,
  oil_filter_number text,
  fuel_filter_number text,
  air_filter_number text,
  active boolean not null default true,
  notes text
);

create index if not exists equipment_location_id_idx on public.equipment (location_id);

-- farms
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_user_id uuid references public.app_users(id) on delete set null,
  email text,
  phone text,
  website_url text,
  app_url text,
  favicon_url text,
  logo_url text,
  created_at timestamptz not null default now()
);

create index if not exists farms_admin_user_id_idx on public.farms (admin_user_id);

-- app_users
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  name text not null,
  first_name text,
  last_name text,
  email text not null unique,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  last_modified_at timestamptz,
  last_modified_by_id uuid references public.app_users(id) on delete set null
);

-- maintenance_logs
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  created_by_id uuid references public.app_users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  logged_at timestamptz not null default now(),
  hours_on_meter numeric,
  maintenance_date date,
  next_due_at timestamptz
);

create index if not exists maintenance_logs_equipment_id_idx on public.maintenance_logs (equipment_id);
create index if not exists maintenance_logs_created_by_id_idx on public.maintenance_logs (created_by_id);

-- Migration helpers to align an existing database with the schema above
alter table if exists public.equipment
  add column if not exists unit_number text,
  add column if not exists vin_sn text,
  add column if not exists year_of_purchase integer,
  add column if not exists license_class text,
  add column if not exists next_service_at date,
  add column if not exists cvip_expires_at date,
  add column if not exists insurance_expires_at date,
  add column if not exists oil_filter_number text,
  add column if not exists fuel_filter_number text,
  add column if not exists air_filter_number text;

alter table if exists public.maintenance_logs
  add column if not exists maintenance_date date;

alter table if exists public.app_users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists last_modified_at timestamptz,
  add column if not exists last_modified_by_id uuid references public.app_users(id) on delete set null;

alter table if exists public.farms
  add column if not exists website_url text,
  add column if not exists app_url text,
  add column if not exists favicon_url text,
  add column if not exists logo_url text;

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_user_id uuid references public.app_users(id) on delete set null,
  email text,
  phone text,
  website_url text,
  app_url text,
  favicon_url text,
  logo_url text,
  created_at timestamptz not null default now()
);

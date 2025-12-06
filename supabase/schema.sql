-- Farm Kit schema (data model v0.0.6)
-- Tables: app_users, farms, locations, buildings, equipment, maintenance_logs

-- Ensure uuid generation
create extension if not exists "pgcrypto";

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

-- farms (hq_location_id added after locations exist)
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

-- locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  name text not null,
  code text,
  is_primary boolean default false,
  address_line1 text,
  address_line2 text,
  city text,
  province text,
  postal_code text,
  country text default 'Canada',
  latitude numeric,
  longitude numeric,
  nearest_town text,
  nearest_hospital_name text,
  nearest_hospital_distance_km numeric,
  primary_contact_name text,
  primary_contact_phone text,
  emergency_instructions text,
  has_fuel_storage boolean default false,
  has_chemical_storage boolean default false,
  notes text,
  created_at timestamptz default now(),
  last_modified_at timestamptz,
  last_modified_by_id uuid references public.app_users(id) on delete set null
);

-- farms.hq_location_id (added after locations exist to avoid circular dependency)
alter table if exists public.farms
  add column if not exists hq_location_id uuid references public.locations(id) on delete set null;

-- buildings
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  name text not null,
  code text,
  type text,
  description text,
  capacity text,
  year_built int,
  heated boolean,
  has_water boolean,
  has_three_phase_power boolean,
  notes text,
  created_at timestamptz default now(),
  last_modified_at timestamptz,
  last_modified_by_id uuid references public.app_users(id) on delete set null
);

create index if not exists buildings_location_id_idx on public.buildings (location_id);

-- equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.locations(id) on delete set null,
  building_id uuid references public.buildings(id) on delete set null,
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
alter table if exists public.farms
  add column if not exists website_url text,
  add column if not exists app_url text,
  add column if not exists favicon_url text,
  add column if not exists logo_url text,
  add column if not exists hq_location_id uuid references public.locations(id) on delete set null;

alter table if exists public.locations
  add column if not exists farm_id uuid references public.farms(id) on delete cascade,
  add column if not exists code text,
  add column if not exists is_primary boolean default false,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists postal_code text,
  add column if not exists country text default 'Canada',
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists nearest_town text,
  add column if not exists nearest_hospital_name text,
  add column if not exists nearest_hospital_distance_km numeric,
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_phone text,
  add column if not exists emergency_instructions text,
  add column if not exists has_fuel_storage boolean default false,
  add column if not exists has_chemical_storage boolean default false,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists last_modified_at timestamptz,
  add column if not exists last_modified_by_id uuid references public.app_users(id) on delete set null;

create index if not exists locations_farm_id_idx on public.locations (farm_id);

alter table if exists public.equipment
  add column if not exists location_id uuid references public.locations(id) on delete set null,
  add column if not exists building_id uuid references public.buildings(id) on delete set null,
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

create index if not exists equipment_location_id_idx on public.equipment (location_id);
create index if not exists equipment_building_id_idx on public.equipment (building_id);

alter table if exists public.maintenance_logs
  add column if not exists maintenance_date date;

alter table if exists public.app_users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists last_modified_at timestamptz,
  add column if not exists last_modified_by_id uuid references public.app_users(id) on delete set null;

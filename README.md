# Farm Kit
Low-cost, open-source farm equipment maintenance tracker for small and medium farms.

Farm Kit is a simple web app that helps farms track equipment, log maintenance, and manage users. Built to stay affordable, easy to use, and easy to host. This repo is the open-source version; farms can self-host for free or use a managed option later.

---

## Project goals
- Keep long-term costs as low as possible  
- Make setup simple for any farm  
- Support many users without per-user fees  
- Keep the app easy to maintain and extend  
- Allow farmers to self-host if they want  
- Provide a template so new farms can get running fast  

---

## Tech stack
- **React** (frontend)  
- **Supabase** (Postgres + Auth + API)  
- **Netlify / Vercel** (hosting)  
- **PWA-friendly** frontend for mobile use  

---

## Core features (v1)
- Admin and general user roles  
- Add/edit equipment, locations, users  
- Log maintenance tasks  
- Search and filter equipment  
- Export logs  
- Simple, mobile-friendly UI  

---

## Data model (current)

### locations
| field     | type | notes         |
|-----------|------|---------------|
| id        | uuid | primary key   |
| name      | text | required      |
| farm_name | text | optional      |
| notes     | text | optional      |

### equipment
| field                | type   | notes                                   |
|----------------------|--------|-----------------------------------------|
| id                   | uuid   | primary key                             |
| location_id          | uuid   | FK to locations                         |
| category             | text   | tractor, auger, piler, etc.             |
| make                 | text   | manufacturer                            |
| model                | text   | model name/number                       |
| nickname             | text   | common label used by the farm           |
| serial_number        | text   | optional                                |
| year                 | int    | optional                                |
| unit_number          | text   | optional fleet/unit number              |
| vin_sn               | text   | optional VIN/SN                         |
| year_of_purchase     | int    | optional                                |
| license_class        | text   | optional                                |
| next_service_at      | date   | optional                                |
| cvip_expires_at      | date   | optional                                |
| insurance_expires_at | date   | optional                                |
| oil_filter_number    | text   | optional                                |
| fuel_filter_number   | text   | optional                                |
| air_filter_number    | text   | optional                                |
| active               | bool   | default true                            |
| notes                | text   | optional                                |

### app_users
| field        | type      | notes                     |
|--------------|-----------|---------------------------|
| id           | uuid      |                           |
| auth_user_id | uuid      | Supabase auth user id     |
| name         | text      | full display name         |
| first_name   | text      | optional                   |
| last_name    | text      | optional                   |
| email        | text      | unique                     |
| role         | text      | e.g. admin, user           |
| created_at   | timestamp |                           |

### maintenance_logs
| field            | type        | notes                         |
|------------------|-------------|-------------------------------|
| id               | uuid        |                               |
| equipment_id     | uuid        |                               |
| created_by_id    | uuid        |                               |
| title            | text        |                               |
| description      | text        |                               |
| status           | text        | e.g. open, done               |
| logged_at        | timestamptz | when the log was submitted    |
| maintenance_date | date        | when the work was performed   |
| hours_on_meter   | numeric     | optional                      |
| next_due_at      | timestamptz | optional                      |

### farms
| field          | type        | notes                         |
|----------------|-------------|-------------------------------|
| id             | uuid        | primary key                   |
| name           | text        | required                      |
| admin_user_id  | uuid        | FK to app_users               |
| email          | text        | optional                      |
| phone          | text        | optional                      |
| created_at     | timestamptz |                               |

---

## Seeding the database

1) Apply schema changes (run once):
```sql
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
```
2) Seed sample data:
- Supabase SQL editor: run `supabase/seed_sample_data.sql`
- Or `psql "$SUPABASE_DB_URL" -f supabase/seed_sample_data.sql`

3) Refresh the app at `http://localhost:5173/` (logged in) to see seeded records.

---

## License
MIT License.  
You can use, modify, self-host, or build on Farm Kit freely.

---

## Status
Early development. Expect changes as the app takes shape.

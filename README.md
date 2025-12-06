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
| field                       | type      | notes                           |
|-----------------------------|-----------|---------------------------------|
| id                          | uuid      | primary key                     |
| farm_id                     | uuid      | FK to farms                     |
| name                        | text      | required                        |
| code                        | text      | optional                        |
| is_primary                  | boolean   | default false                   |
| address_line1/2             | text      | optional                        |
| city/province/postal_code   | text      | optional                        |
| country                     | text      | default 'Canada'                |
| nearest_town                | text      | optional                        |
| nearest_hospital_name       | text      | optional                        |
| nearest_hospital_distance_km| numeric   | optional                        |
| primary_contact_name/phone  | text      | optional                        |
| emergency_instructions      | text      | optional                        |
| has_fuel_storage            | boolean   | default false                   |
| has_chemical_storage        | boolean   | default false                   |
| notes                       | text      | optional                        |
| created_at                  | timestamptz |                                 |
| last_modified_at/by         | timestamptz/uuid | optional                |

### buildings
| field                | type    | notes                         |
|----------------------|---------|-------------------------------|
| id                   | uuid    | primary key                   |
| farm_id              | uuid    | FK to farms                   |
| location_id          | uuid    | FK to locations               |
| name                 | text    | required                      |
| code                 | text    | optional                      |
| type                 | text    | optional                      |
| description          | text    | optional                      |
| capacity             | text    | optional                      |
| year_built           | int     | optional                      |
| heated               | boolean | optional                      |
| has_water            | boolean | optional                      |
| has_three_phase_power| boolean | optional                      |
| notes                | text    | optional                      |
| created_at           | timestamptz |                             |
| last_modified_at/by  | timestamptz/uuid | optional              |

### equipment
| field                | type   | notes                                   |
|----------------------|--------|-----------------------------------------|
| id                   | uuid   | primary key                             |
| location_id          | uuid   | FK to locations (nullable)              |
| building_id          | uuid   | FK to buildings (nullable)              |
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
| last_modified_at | timestamptz | optional            |
| last_modified_by_id | uuid    | FK to app_users      |

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
| field           | type        | notes                               |
|-----------------|-------------|-------------------------------------|
| id              | uuid        | primary key                         |
| name            | text        | required                            |
| admin_user_id   | uuid        | FK to app_users                     |
| hq_location_id  | uuid        | FK to locations (nullable)          |
| email           | text        | optional                            |
| phone           | text        | optional                            |
| website_url     | text        | optional                            |
| app_url         | text        | optional                            |
| favicon_url     | text        | optional (derived from site)        |
| logo_url        | text        | optional (displayed in header)      |
| created_at      | timestamptz |                                     |

---

## Seeding the database

- Supabase SQL editor: run `supabase/seed_sample_data.sql`
- Or `psql "$SUPABASE_DB_URL" -f supabase/seed_sample_data.sql`
- Refresh the app at `http://localhost:5173/` (logged in) to see seeded records.

## Inviting users (server-side)
- Requires service role key (never expose to frontend).
- Send an invite and upsert `app_users`:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node supabase/invite_user.ts user@example.com admin "First" "Last"
```
The script uses `auth.admin.inviteUserByEmail`, upserts `app_users` with the returned `auth_user_id`, and defaults role to `user` if not specified.

To wire the frontend “Send login email” button (Manage Users page):
- Provide an HTTP endpoint (e.g., Netlify/Vercel function) at `VITE_INVITE_ENDPOINT` (defaults to `/api/send-invite`).
- That endpoint must call Supabase `auth.admin.inviteUserByEmail` using the service role key and upsert `app_users` (similar to `supabase/invite_user.ts`), returning 200 on success or an error JSON: `{ "error": "message" }`.
- Do NOT expose the service role key to the browser; keep it only in your serverless function/secret store.

---

## License
MIT License.  
You can use, modify, self-host, or build on Farm Kit freely.

---

## Status
Early development (Alpha). Expect changes as the app takes shape.

## Release notes
- 0.0.4: First live deploy (alpha)
- 0.0.5: Equipment slug routing, quick search updates
- 0.0.6: Responsive nav polish for mobile/tablet
- 0.0.7: Locations/Buildings UI, Admin Tools + activity feed, primary “Add Log” button

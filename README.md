# Farm Kit
Low-cost, open-source farm equipment maintenance tracker for small and medium farms.

Farm Kit is a simple web app that helps farms track equipment, log maintenance, and manage users. Built to stay affordable, easy to use, and easy to host. Ideal for farms that don’t want expensive ERP systems or complicated software.

This repo is the open-source version. Farms can self-host for free or use a managed hosting option later on.

---

## Project goals
- Keep long-term costs as low as possible  
- Make setup simple for any farm  
- Support many users without per-user fees  
- Keep the app easy to maintain and easy to extend  
- Allow farmers to self-host or run on their own server if they want  
- Provide a template so new farms can get running fast  

---

## Tech stack
- **React** (frontend)  
- **Supabase** (Postgres + Auth + API)  
- **Netlify / Vercel** (hosting)  
- **PWA-friendly** frontend for good mobile use  

---

## Core features (v1)
- Admin and general user roles  
- Add/edit equipment  
- Add/edit locations  
- Add/edit users  
- Log maintenance tasks  
- Search and filter equipment  
- Export logs  
- Simple, mobile-friendly UI  

---

## Planned features
- QR / barcode scanning for quick equipment lookup  
- Optional label printing  
- Shared open database of equipment types  
- Maintenance templates based on equipment model  
- VIN / serial number lookup (API or community database)  
- Scheduled maintenance reminders  
- Optional cloud hosting service (similar to the Home Assistant model)  

---

## Data model (initial draft)

### locations
| field       | type | notes                   |
|-------------|------|-------------------------|
| id          | uuid | primary key             |
| name        | text | location name           |
| farm_name   | text | optional                |
| notes       | text | optional                |

### equipment
| field         | type  | notes                                   |
|---------------|--------|-----------------------------------------|
| id            | uuid   | primary key                             |
| location_id   | uuid   | FK to locations                         |
| category      | text   | tractor, auger, piler, etc.             |
| make          | text   | manufacturer                            |
| model         | text   | model name/number                       |
| nickname      | text   | “Unit 41”, etc.                         |
| serial_number | text   | optional                                |
| year          | int    | optional                                |
| active        | bool   | default true                            |
| notes         | text   | optional                                |

### app_users
| field        | type   |
|--------------|--------|
| id           | uuid   |
| auth_user_id | uuid   |
| name         | text   |
| email        | text   |
| role         | text   |
| created_at   | timestamp |

### maintenance_logs
| field          | type       |
|----------------|------------|
| id             | uuid       |
| equipment_id   | uuid       |
| created_by_id  | uuid       |
| title          | text       |
| description    | text       |
| status         | text       |
| logged_at      | timestamp  |
| hours_on_meter | numeric    |
| next_due_at    | timestamp  |

---

## License
MIT License.  
You can use, modify, self-host, or build on Farm Kit freely.

---

## Status
Early development. Expect changes as the app takes shape.

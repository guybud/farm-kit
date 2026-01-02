# Data model (current)

## locations
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

## buildings
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

## equipment
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

## app_users
| field        | type      | notes                     |
|--------------|-----------|---------------------------|
| id           | uuid      |                           |
| auth_user_id | uuid      | Supabase auth user id     |
| name         | text      | full display name         |
| first_name   | text      | optional                   |
| last_name    | text      | optional                        |
| email        | text      | unique                     |
| role         | text      | e.g. admin, user           |
| created_at   | timestamp |                           |
| last_modified_at | timestamptz | optional            |
| last_modified_by_id | uuid    | FK to app_users      |

## maintenance_logs
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

## farms
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

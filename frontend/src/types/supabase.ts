// Auto-generated-style Supabase types (manually curated for now)

export type Location = {
  id: string;
  farm_id: string;
  name: string;
  code: string | null;
  is_primary: boolean;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_town: string | null;
  nearest_hospital_name: string | null;
  nearest_hospital_distance_km: number | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  emergency_instructions: string | null;
  has_fuel_storage: boolean;
  has_chemical_storage: boolean;
  notes: string | null;
  created_at: string;
  last_modified_at: string | null;
  last_modified_by_id: string | null;
};

export type Building = {
  id: string;
  farm_id: string;
  location_id: string;
  name: string;
  code: string | null;
  type: string | null;
  description: string | null;
  capacity: string | null;
  year_built: number | null;
  heated: boolean | null;
  has_water: boolean | null;
  has_three_phase_power: boolean | null;
  notes: string | null;
  created_at: string;
  last_modified_at: string | null;
  last_modified_by_id: string | null;
};

export type Equipment = {
  id: string;
  location_id: string | null;
  building_id: string | null;
  category: string | null;
  make: string | null;
  model: string | null;
  nickname: string | null;
  serial_number: string | null;
  year: number | null;
  unit_number: string | null;
  vin_sn: string | null;
  year_of_purchase: number | null;
  license_class: string | null;
  next_service_at: string | null;
  cvip_expires_at: string | null;
  insurance_expires_at: string | null;
  oil_filter_number: string | null;
  fuel_filter_number: string | null;
  air_filter_number: string | null;
  active: boolean | null;
  notes: string | null;
};

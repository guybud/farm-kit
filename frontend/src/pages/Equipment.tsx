import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Equipment = {
  id: string;
  location_id: string | null;
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

type EquipmentPageProps = {
  session: Session;
};

function EquipmentPage({ session }: EquipmentPageProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.from('equipment').select('*');
      if (err) {
        setError(err.message);
        setEquipment([]);
      } else {
        setEquipment(data ?? []);
      }
      setLoading(false);
    };

    fetchEquipment();
  }, []);

  return (
    <>
      <Nav session={session} email={session.user.email} />
      <div className="app">
        <div className="card stack">
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <h1>Equipment</h1>
            <button type="button">Add equipment</button>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p className="status">{error}</p>}

          {!loading && !error && equipment.length === 0 && (
            <p>No equipment found.</p>
          )}

          {!loading && !error && equipment.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Unit #</th>
                  <th>Nickname</th>
                  <th>Category</th>
                  <th>Make</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item.id}>
                    <td>{item.unit_number ?? '-'}</td>
                    <td>{item.nickname ?? '-'}</td>
                    <td>{item.category ?? '-'}</td>
                    <td>{item.make ?? '-'}</td>
                    <td>{item.model ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default EquipmentPage;

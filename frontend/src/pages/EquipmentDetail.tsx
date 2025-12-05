import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type Equipment = {
  id: string;
  nickname: string | null;
  category: string | null;
  make: string | null;
  model: string | null;
  unit_number: string | null;
  vin_sn: string | null;
  year: number | null;
  year_of_purchase: number | null;
  license_class: string | null;
  next_service_at: string | null;
  cvip_expires_at: string | null;
  insurance_expires_at: string | null;
  oil_filter_number: string | null;
  fuel_filter_number: string | null;
  air_filter_number: string | null;
};

type MaintenanceLog = {
  id: string;
  title: string;
  status: string | null;
  maintenance_date: string | null;
  logged_at: string;
  description: string | null;
};

function EquipmentDetail({ session }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decoded = useMemo(() => decodeURIComponent(slug ?? ''), [slug]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      let equipRes = await supabase
        .from('equipment')
        .select('*')
        .eq('nickname', decoded)
        .maybeSingle();

      if (!equipRes.data) {
        equipRes = await supabase
          .from('equipment')
          .select('*')
          .eq('id', decoded)
          .maybeSingle();
      }

      const equip = equipRes.data;
      const equipErr = equipRes.error;
      if (!active) return;
      if (equipErr || !equip) {
        setError(equipErr?.message ?? 'Equipment not found');
        setEquipment(null);
        setLogs([]);
        setLoading(false);
        return;
      }
      setEquipment(equip as Equipment);

      const { data: logRows, error: logErr } = await supabase
        .from('maintenance_logs')
        .select('id, title, status, maintenance_date, logged_at, description')
        .eq('equipment_id', equip.id)
        .order('maintenance_date', { ascending: false })
        .order('logged_at', { ascending: false });

      if (logErr) {
        setError(logErr.message);
        setLogs([]);
      } else {
        setLogs(logRows ?? []);
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [decoded]);

  if (loading) {
    return (
      <>
        <Nav session={session} email={session.user.email} pageTitle="Equipment Detail" />
        <div className="app">
          <div className="card">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !equipment) {
    return (
      <>
        <Nav session={session} email={session.user.email} pageTitle="Equipment Detail" />
        <div className="app">
          <div className="card">
            <p className="status">{error ?? 'Equipment not found'}</p>
            <Link to="/equipment">Back to Equipment</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="Equipment Detail" />
      <div className="app">
        <div className="card stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1>{equipment.nickname ?? 'Equipment'}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link className="nav-btn" to={`/maintenance/add?equipment_id=${equipment.id}`}>
                Log Maintenance
              </Link>
              <Link className="nav-btn" to="/equipment">
                Back to list
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div><strong>Category:</strong> {equipment.category ?? '-'}</div>
            <div><strong>Make:</strong> {equipment.make ?? '-'}</div>
            <div><strong>Model:</strong> {equipment.model ?? '-'}</div>
            <div><strong>Unit #:</strong> {equipment.unit_number ?? '-'}</div>
            <div><strong>VIN/SN:</strong> {equipment.vin_sn ?? '-'}</div>
            <div><strong>Year:</strong> {equipment.year ?? equipment.year_of_purchase ?? '-'}</div>
            <div><strong>License class:</strong> {equipment.license_class ?? '-'}</div>
            <div><strong>Next service:</strong> {equipment.next_service_at ?? '-'}</div>
            <div><strong>CVIP expires:</strong> {equipment.cvip_expires_at ?? '-'}</div>
            <div><strong>Insurance expires:</strong> {equipment.insurance_expires_at ?? '-'}</div>
            <div><strong>Oil filter:</strong> {equipment.oil_filter_number ?? '-'}</div>
            <div><strong>Fuel filter:</strong> {equipment.fuel_filter_number ?? '-'}</div>
            <div><strong>Air filter:</strong> {equipment.air_filter_number ?? '-'}</div>
          </div>
        </div>

        <div className="card stack">
          <h2>Maintenance Logs</h2>
          {logs.length === 0 && <p>No maintenance logs yet.</p>}
          {logs.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Logged at</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.maintenance_date ?? '-'}</td>
                    <td>{log.title}</td>
                    <td>{log.status ?? '-'}</td>
                    <td>{log.logged_at}</td>
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

export default EquipmentDetail;

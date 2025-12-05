import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type MaintenanceLog = {
  id: string;
  equipment_id: string;
  created_by_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  logged_at: string;
  hours_on_meter: number | null;
  next_due_at: string | null;
  maintenance_date: string | null;
};

type MaintenanceLogInsert = Partial<Omit<MaintenanceLog, 'id'>> &
  Pick<MaintenanceLog, 'equipment_id' | 'title' | 'maintenance_date'>;

type EquipmentOption = {
  id: string;
  nickname: string | null;
  unit_number: string | null;
  category: string | null;
};

function AddMaintenanceLog({ session }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>(
    [],
  );
  const [createdById, setCreatedById] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const equipmentLabel = useMemo(() => {
    return equipmentOptions.reduce<Record<string, string>>((acc, item) => {
      const labelParts = [
        item.unit_number ? `Unit ${item.unit_number}` : null,
        item.nickname,
      ].filter(Boolean);
      acc[item.id] = labelParts.join(' - ') || 'Unknown equipment';
      return acc;
    }, {});
  }, [equipmentOptions]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        equipmentOptions
          .map((item) => item.category)
          .filter((cat): cat is string => Boolean(cat)),
      ),
    ).sort();
  }, [equipmentOptions]);

  const filteredEquipment = useMemo(() => {
    let items = equipmentOptions;
    if (categoryFilter) {
      items = items.filter((item) => item.category === categoryFilter);
    }
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.nickname,
          item.unit_number,
          item.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }
    return items;
  }, [equipmentOptions, categoryFilter, searchFilter]);

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data, error: err } = await supabase
        .from('equipment')
        .select('id, nickname, unit_number, category')
        .order('nickname', { ascending: true });
      if (err) {
        setError(err.message);
        setEquipmentOptions([]);
      } else {
        setEquipmentOptions(data ?? []);
      }
    };

    const fetchUser = async () => {
      const { data, error: userErr } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (userErr) {
        setError(userErr.message);
      } else {
        setCreatedById(data?.id ?? null);
      }
    };

    fetchEquipment();
    fetchUser();

    const params = new URLSearchParams(location.search);
    const preselect = params.get('equipment_id');
    if (preselect) {
      setEquipmentId(preselect);
    }
  }, [session.user.id, location.search]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!equipmentId) {
      setError('Select equipment for this maintenance log.');
      return;
    }
    if (!createdById) {
      setError('Could not resolve your profile to set created_by_id.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('maintenance_logs')
      .insert<MaintenanceLogInsert>({
        equipment_id: equipmentId,
        created_by_id: createdById,
        title,
        description: description || null,
        maintenance_date: maintenanceDate || null,
        logged_at: new Date().toISOString(),
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    navigate('/app');
  };

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="Add Maintenance Log" />
      <div className="app">
        <div className="card">
          <h1>Add Maintenance Log</h1>
          <form onSubmit={handleSubmit} className="stack">
            <label className="stack">
              <span>Maintenance date</span>
              <input
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
              />
            </label>

            <label className="stack">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setEquipmentId('');
                }}
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack">
              <span>Search equipment</span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setEquipmentId('');
                }}
                placeholder="Search nickname, unit #, or category"
              />
            </label>

            {searchFilter.trim() && (
              <div
                className="card"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                }}
              >
                <div style={{ marginBottom: '0.35rem', fontWeight: 700 }}>
                  Results
                </div>
                {filteredEquipment.length === 0 && <p>No matches</p>}
                {filteredEquipment.length > 0 && (
                  <div className="stack" style={{ gap: '0.4rem' }}>
                    {filteredEquipment.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        style={{
                          textAlign: 'left',
                          background: '#fff',
                          color: '#0f172a',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.5rem 0.65rem',
                        }}
                        onClick={() => {
                          setEquipmentId(item.id);
                          setSearchFilter('');
                        }}
                      >
                        {equipmentLabel[item.id] ?? 'Unknown equipment'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label className="stack">
              <span>Equipment</span>
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                required
              >
                <option value="">Select equipment</option>
                {filteredEquipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {equipmentLabel[item.id] ?? 'Unknown equipment'}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="stack">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Add Maintenance Log'}
            </button>

            {error && <p className="status">{error}</p>}
          </form>
        </div>
      </div>
    </>
  );
}

export default AddMaintenanceLog;

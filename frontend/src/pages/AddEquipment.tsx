import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

function AddEquipment({ session }: Props) {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [category, setCategory] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [unitNumber, setUnitNumber] = useState('');
  const [vinSn, setVinSn] = useState('');
  const [yearOfPurchase, setYearOfPurchase] = useState<number | ''>('');
  const [licenseClass, setLicenseClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from('equipment').insert({
      nickname,
      category,
      make,
      model,
      serial_number: serialNumber || null,
      year: year === '' ? null : year,
      unit_number: unitNumber || null,
      vin_sn: vinSn || null,
      year_of_purchase: yearOfPurchase === '' ? null : yearOfPurchase,
      license_class: licenseClass || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    navigate('/equipment');
  };

  return (
    <>
      <Nav email={session.user.email} />
      <div className="app">
        <div className="card">
          <h1>Add Equipment</h1>
          <form onSubmit={handleSubmit} className="stack">
            <label className="stack">
              <span>Nickname</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </label>

            <label className="stack">
              <span>Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </label>

            <label className="stack">
              <span>Make</span>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />
            </label>

            <label className="stack">
              <span>Model</span>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </label>

            <label className="stack">
              <span>Unit number (optional)</span>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </label>

            <label className="stack">
              <span>VIN / SN (optional)</span>
              <input
                type="text"
                value={vinSn}
                onChange={(e) => setVinSn(e.target.value)}
              />
            </label>

            <label className="stack">
              <span>Serial Number (optional)</span>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </label>

            <label className="stack">
              <span>Year (optional)</span>
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  const value = e.target.value;
                  setYear(value === '' ? '' : Number(value));
                }}
              />
            </label>

            <label className="stack">
              <span>Year of purchase (optional)</span>
              <input
                type="number"
                value={yearOfPurchase}
                onChange={(e) => {
                  const value = e.target.value;
                  setYearOfPurchase(value === '' ? '' : Number(value));
                }}
              />
            </label>

            <label className="stack">
              <span>License class (optional)</span>
              <input
                type="text"
                value={licenseClass}
                onChange={(e) => setLicenseClass(e.target.value)}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Add Equipment'}
            </button>

            {error && <p className="status">{error}</p>}
          </form>
        </div>
      </div>
    </>
  );
}

export default AddEquipment;

import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type Farm = {
  id?: string;
  name: string;
  admin_user_id: string | null;
  email: string | null;
  phone: string | null;
};

type UserOption = {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

function FarmSetup({ session }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const adminName = (user: UserOption) => {
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.name ||
      user.email;
    return `${name} (${user.email})`;
  };

  const farmState = useMemo(() => {
    return (
      farm ?? {
        name: '',
        admin_user_id: null,
        email: '',
        phone: '',
      }
    );
  }, [farm]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      const [{ data: profile, error: profileErr }] = await Promise.all([
        supabase
          .from('app_users')
          .select('id, role')
          .eq('auth_user_id', session.user.id)
          .maybeSingle(),
      ]);

      if (!active) return;
      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }

      setRole(profile?.role ?? null);

      const [{ data: farmData, error: farmErr }, { data: usersData, error: usersErr }] =
        await Promise.all([
          supabase
            .from('farms')
            .select('id, name, admin_user_id, email, phone')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('app_users')
            .select('id, name, first_name, last_name, email')
            .order('name', { ascending: true }),
        ]);

      if (!active) return;
      if (farmErr) {
        setError(farmErr.message);
      } else {
        setFarm(farmData ?? null);
      }
      if (usersErr) {
        setError(usersErr.message);
      } else {
        setUsers(usersData ?? []);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (role !== 'admin') return;

    setSaving(true);
    setError(null);
    setStatus('');

    const payload: Farm = {
      id: farmState.id,
      name: farmState.name.trim(),
      admin_user_id: farmState.admin_user_id || null,
      email: farmState.email || null,
      phone: farmState.phone || null,
    };

    const { error: upsertError } = await supabase.from('farms').upsert(payload);
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setStatus('Farm settings saved.');
    setSaving(false);
  };

  if (role !== 'admin' && !loading) {
    return (
      <>
        <Nav email={session.user.email} />
        <div className="app">
          <div className="card stack">
            <h1>Farm Setup</h1>
            <p>You do not have permission to access this page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav email={session.user.email} />
      <div className="app">
        <div className="card stack">
          <h1>Farm Setup</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form className="stack" onSubmit={handleSubmit}>
              <label className="stack">
                <span>Farm name</span>
                <input
                  type="text"
                  value={farmState.name}
                  onChange={(e) =>
                    setFarm({ ...farmState, name: e.target.value })
                  }
                  required
                />
              </label>

              <label className="stack">
                <span>Farm admin (user)</span>
                <select
                  value={farmState.admin_user_id ?? ''}
                  onChange={(e) =>
                    setFarm({
                      ...farmState,
                      admin_user_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">Select admin</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {adminName(u)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="stack">
                <span>Farm email</span>
                <input
                  type="email"
                  value={farmState.email ?? ''}
                  onChange={(e) =>
                    setFarm({ ...farmState, email: e.target.value })
                  }
                  placeholder="farm@example.com"
                />
              </label>

              <label className="stack">
                <span>Farm phone</span>
                <input
                  type="tel"
                  value={farmState.phone ?? ''}
                  onChange={(e) =>
                    setFarm({ ...farmState, phone: e.target.value })
                  }
                  placeholder="555-123-4567"
                />
              </label>

              <button type="submit" disabled={saving || role !== 'admin'}>
                {saving ? 'Saving...' : 'Save'}
              </button>

              {status && <p className="status">{status}</p>}
              {error && <p className="status">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default FarmSetup;

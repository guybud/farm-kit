import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type Profile = {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

function Account({ session }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const fullName = useMemo(() => {
    const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
    return combined || session.user.email;
  }, [firstName, lastName, session.user.email]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('app_users')
        .select('id, auth_user_id, email, name, first_name, last_name, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (!active) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
      } else {
        setProfile(null);
        setFirstName('');
        setLastName('');
      }
      setLoading(false);
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus('');

    const role = profile?.role ?? 'user';

    const { error: upsertError } = await supabase.from('app_users').upsert(
      {
        id: profile?.id,
        auth_user_id: session.user.id,
        email: session.user.email,
        first_name: firstName || null,
        last_name: lastName || null,
        name: fullName,
        role,
      },
      { onConflict: 'auth_user_id' },
    );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setStatus('Profile updated.');
    setSaving(false);
  };

  return (
    <>
      <Nav session={session} email={session.user.email} />
      <div className="app">
        <div className="card stack">
          <h1>Account</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form className="stack" onSubmit={handleSubmit}>
              <label className="stack">
                <span>Email</span>
                <input type="email" value={session.user.email} disabled />
              </label>

              <label className="stack">
                <span>First name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
              </label>

              <label className="stack">
                <span>Last name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </label>

              <label className="stack">
                <span>Display name</span>
                <input type="text" value={fullName} disabled />
                <small>Derived from first/last; saved to the profile name.</small>
              </label>

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
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

export default Account;

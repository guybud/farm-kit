import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type NavProps = {
  session?: Session;
  email?: string;
  pageTitle?: string;
};

function Nav({ session, email, pageTitle }: NavProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [farmName, setFarmName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!session?.user) return;
      const [{ data: profile }, { data: farm }] = await Promise.all([
        supabase
          .from('app_users')
          .select('name')
          .eq('auth_user_id', session.user.id)
          .maybeSingle(),
        supabase.from('farms').select('name').order('created_at').limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setDisplayName(profile?.name ?? null);
      setFarmName(farm?.name ?? null);
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [session?.user]);

  useEffect(() => {
    const baseTitle = 'Farm Kit';
    const farm = farmName ? `${farmName} | ` : '';
    const page = pageTitle ? `${pageTitle} | ` : '';
    document.title = `${page}${farm}${baseTitle}`;
  }, [farmName, pageTitle]);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setLoading(false);
      return;
    }
    navigate('/login', { replace: true });
  };

  const welcomeText = displayName || email || session?.user.email || '';
  const displayLink = <Link to="/account">Set display name</Link>;
  const farmLink = <Link to="/farm">Set farm name</Link>;
  const displayNode = welcomeText ? <strong>{welcomeText}</strong> : displayLink;

  return (
    <nav className="card stack" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/app">Home</Link>
        <Link to="/equipment">Equipment</Link>
        <Link to="/equipment/add">Add Equipment</Link>
        <Link to="/maintenance/add">Add Maintenance Log</Link>
        <Link to="/account">Account</Link>
        <Link to="/farm">Farm Setup</Link>
        <Link to="/users">Users</Link>
        <span style={{ flex: 1 }} />
        <button onClick={handleLogout} disabled={loading}>
          {loading ? 'Signing out...' : 'Logout'}
        </button>
      </div>
      <div className="stack" style={{ alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.9rem' }}>
          Welcome {displayNode}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {farmName || farmLink}
        </div>
      </div>
      {error && <p className="status">{error}</p>}
    </nav>
  );
}

export default Nav;

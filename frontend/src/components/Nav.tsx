import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type NavProps = {
  email?: string;
};

function Nav({ email }: NavProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  return (
    <nav className="card stack" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/app">Home</Link>
        <Link to="/equipment">Equipment</Link>
        <Link to="/equipment/add">Add Equipment</Link>
        <Link to="/maintenance/add">Add Maintenance Log</Link>
        <Link to="/account">Account</Link>
        <Link to="/farm">Farm Setup</Link>
        <span style={{ flex: 1 }} />
        {email && <span>{email}</span>}
        <button onClick={handleLogout} disabled={loading}>
          {loading ? 'Signing out...' : 'Logout'}
        </button>
      </div>
      {error && <p className="status">{error}</p>}
    </nav>
  );
}

export default Nav;

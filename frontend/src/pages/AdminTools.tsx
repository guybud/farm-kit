import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import { supabase } from '../lib/supabaseClient';

type Props = { session: Session };

function AdminTools({ session }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      setRole(data?.role ?? null);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  const isAdmin = role === 'admin';

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="Admin Tools" />
      <div className="app">
        <div className="card stack">
          <h1>Admin Tools</h1>
          {loading && <p>Loading...</p>}
          {!loading && !isAdmin && <p className="status">You do not have permission to view this page.</p>}
          {!loading && isAdmin && (
            <div className="stack">
              <p>Quick links for administrators:</p>
              <div
                style={{
                  display: 'grid',
                  gap: '0.75rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                }}
              >
                <Link className="nav-btn" to="/users">Manage Users</Link>
                <Link className="nav-btn" to="/farm">Farm Setup</Link>
                <Link className="nav-btn" to="/locations">Locations</Link>
                <Link className="nav-btn" to="/buildings">Buildings</Link>
                <Link className="nav-btn" to="/equipment">Equipment</Link>
                <Link className="nav-btn" to="/maintenance/add">Log Maintenance</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminTools;

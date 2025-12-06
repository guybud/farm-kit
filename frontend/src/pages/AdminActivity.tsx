import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Nav from '../components/Nav';
import { supabase } from '../lib/supabaseClient';

type Props = { session: Session };

type Activity = {
  id: string;
  title: string;
  logged_at: string;
  description: string | null;
  created_by_id: string | null;
};

function AdminActivity({ session }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadRole = async () => {
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      setRole(data?.role ?? null);
    };
    loadRole();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  useEffect(() => {
    let active = true;
    const loadActivity = async () => {
      if (role !== 'admin') {
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from('maintenance_logs')
        .select('id, title, logged_at, description, created_by_id')
        .order('logged_at', { ascending: false })
        .limit(50);
      if (!active) return;
      if (err) {
        setError(err.message);
        setActivity([]);
      } else {
        setActivity((data as Activity[]) ?? []);
      }
      setLoading(false);
    };
    loadActivity();
    return () => {
      active = false;
    };
  }, [role]);

  const isAdmin = role === 'admin';

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="User Activity" />
      <div className="app">
        <div className="card stack">
          <h1>User Activity</h1>
          {loading && <p>Loading...</p>}
          {!loading && !isAdmin && <p className="status">You do not have permission to view this page.</p>}
          {!loading && isAdmin && (
            <>
              {error && <p className="status">{error}</p>}
              {!error && activity.length === 0 && <p>No recent activity.</p>}
              {!error && activity.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Logged at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td>{row.description ?? '-'}</td>
                        <td>{row.logged_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminActivity;

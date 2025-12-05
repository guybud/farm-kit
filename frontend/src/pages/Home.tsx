import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type Profile = {
  id: string;
  role: string | null;
};

type MaintenanceLogRow = {
  id: string;
  title: string;
  status: string | null;
  maintenance_date: string | null;
  logged_at: string;
  equipment: {
    nickname: string | null;
    unit_number: string | null;
  } | null;
};

function Home({ session }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<MaintenanceLogRow[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  const quickActions = useMemo(() => {
    const actions = [
      { label: 'Log Maintenance', to: '/maintenance/add', roles: ['admin', 'user'] },
      { label: 'View Equipment', to: '/equipment', roles: ['admin', 'user'] },
      { label: 'Account', to: '/account', roles: ['admin', 'user'] },
    ];
    if (isAdmin) {
      actions.push(
        { label: 'Manage Users', to: '/users', roles: ['admin'] },
        { label: 'Farm Setup', to: '/farm', roles: ['admin'] },
      );
    }
    return actions;
  }, [isAdmin]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  useEffect(() => {
    if (!profile?.id) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }

    let active = true;
    const loadLogs = async () => {
      setLogsLoading(true);
      setLogsError(null);
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('id, title, status, maintenance_date, logged_at, equipment:equipment_id(nickname, unit_number)')
        .eq('created_by_id', profile.id)
        .order('maintenance_date', { ascending: false })
        .order('logged_at', { ascending: false })
        .limit(10);
      if (!active) return;
      if (error) {
        setLogsError(error.message);
        setLogs([]);
      } else {
        setLogs(data ?? []);
      }
      setLogsLoading(false);
    };

    loadLogs();
    return () => {
      active = false;
    };
  }, [profile?.id]);

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="Home" />
      <div className="app">
        <div className="card stack">
          <h1>Dashboard</h1>
          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to}>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    background: '#f8fafc',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                >
                  {action.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card stack">
          <h2>Your Maintenance Logs</h2>
          {logsLoading && <p>Loading...</p>}
          {logsError && <p className="status">{logsError}</p>}
          {!logsLoading && !logsError && logs.length === 0 && (
            <p>
              No maintenance logs yet. <Link to="/maintenance/add">Log maintenance</Link>
            </p>
          )}
          {!logsLoading && !logsError && logs.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Equipment</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.maintenance_date ?? '-'}</td>
                    <td>
                      {log.equipment?.unit_number
                        ? `Unit ${log.equipment.unit_number}`
                        : log.equipment?.nickname || '-'}
                    </td>
                    <td>{log.title}</td>
                    <td>{log.status ?? '-'}</td>
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

export default Home;

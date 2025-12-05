import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

function Home({ session }: Props) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogout = async () => {
    setLoading(true);
    setStatusMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatusMessage(error.message);
    } else {
      setStatusMessage('Signed out.');
    }
    setLoading(false);
  };

  return (
    <>
      <Nav session={session} email={session.user.email} />
      <div className="app">
        <div className="card stack">
          <h1>Dashboard</h1>
          <p>Logged in as {session.user.email}</p>
          <button onClick={handleLogout} disabled={loading}>
            {loading ? 'Signing out...' : 'Logout'}
          </button>
          {statusMessage && <p className="status">{statusMessage}</p>}
        </div>
      </div>
    </>
  );
}

export default Home;

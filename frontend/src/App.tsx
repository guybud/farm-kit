import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import './App.css';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import Equipment from './pages/Equipment';
import AddEquipment from './pages/AddEquipment';
import AddMaintenanceLog from './pages/AddMaintenanceLog';
import Account from './pages/Account';

function RequireAuth({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setAuthReady(true);
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return <div className="app">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login session={session} />} />
        <Route
          path="/app"
          element={
            <RequireAuth session={session}>
              <Home session={session as Session} />
            </RequireAuth>
          }
        />
        <Route
          path="/equipment"
          element={
            <RequireAuth session={session}>
              {/* session is guaranteed non-null here */}
              <Equipment session={session as Session} />
            </RequireAuth>
          }
        />
        <Route
          path="/equipment/add"
          element={
            <RequireAuth session={session}>
              {/* session is guaranteed non-null here */}
              <AddEquipment session={session as Session} />
            </RequireAuth>
          }
        />
        <Route
          path="/maintenance/add"
          element={
            <RequireAuth session={session}>
              <AddMaintenanceLog session={session as Session} />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth session={session}>
              <Account session={session as Session} />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={<Navigate to={session ? '/app' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type Props = {
  session: Session | null;
};

// Public sitekey for the "farmkit-app-login" Cloudflare Turnstile widget
// (covers farmkit.app, www.farmkit.app, dev.farmkit.app). Supabase Auth
// verifies the token server-side; sign-ins without one are rejected.
const TURNSTILE_SITEKEY = '0x4AAAAAAEWUxP1pkyQTek6C';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

function Login({ session }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (session) return;

    const renderWidget = () => {
      if (!captchaRef.current || !window.turnstile || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        callback: (token) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [session]);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!captchaToken) {
      setErrorMessage('Complete the verification check below, then sign in.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'Email or password is incorrect. Check with your farm admin if you need help.'
          : error.message,
      );
      setCaptchaToken('');
      if (widgetIdRef.current !== null) {
        window.turnstile?.reset(widgetIdRef.current);
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="wordmark">Farmkit</div>
          <div className="tagline">Farm equipment & maintenance tracking</div>
        </div>
        <form onSubmit={handleLogin} className="stack">
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div ref={captchaRef} />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {errorMessage && <p className="status error">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Login;

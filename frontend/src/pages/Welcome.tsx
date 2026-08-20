import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type Props = {
  session: Session | null;
};

type OtpType = 'invite' | 'recovery' | 'magiclink';

const OTP_TYPES: OtpType[] = ['invite', 'recovery', 'magiclink'];

function Welcome({ session }: Props) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const verifiedRef = useRef(false);
  const [intent, setIntent] = useState<'invite' | 'reset'>(
    searchParams.get('intent') === 'reset' ? 'reset' : 'invite',
  );

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    if (!tokenHash || session || verifiedRef.current) {
      return;
    }
    verifiedRef.current = true;
    const typeParam = searchParams.get('type');
    const otpType: OtpType = OTP_TYPES.includes(typeParam as OtpType)
      ? (typeParam as OtpType)
      : 'invite';
    setVerifying(true);
    setError(null);

    supabase.auth
      .verifyOtp({ type: otpType, token_hash: tokenHash })
      .then(({ error: verifyError }) => {
        if (verifyError) {
          setError(
            verifyError.message.toLowerCase().includes('expired')
              ? 'This link has expired. Ask your farm admin to send a new one.'
              : verifyError.message,
          );
        } else {
          setSearchParams({}, { replace: true });
        }
      })
      .finally(() => setVerifying(false));
  }, [searchParams, session, setSearchParams]);

  const heading = intent === 'reset' ? 'Reset your password' : 'Welcome to Farmkit';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const { error: acceptError } = await supabase.rpc('farmkit_accept_my_invites');
    if (acceptError) {
      setError(acceptError.message);
      setSaving(false);
      return;
    }

    setMessage('Password saved.');
    setSaving(false);
    setIntent('invite');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="app">
      <div className="card stack" style={{ marginTop: '2rem' }}>
        <div className="page-head">
          <h1>{heading}</h1>
        </div>

        {verifying ? (
          <p className="status">Checking your link...</p>
        ) : !session ? (
          <div className="stack">
            <p className="status">
              {error ?? 'Your link session is not active. Open the latest emailed link or sign in.'}
            </p>
            <button type="button" onClick={() => navigate('/login')}>
              Go to login
            </button>
          </div>
        ) : (
          <form className="stack" onSubmit={handleSubmit}>
            <label>
              <span>{intent === 'reset' ? 'New password' : 'Set password'}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save password'}
            </button>
            {message && <p className="status">{message}</p>}
            {error && <p className="status error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default Welcome;

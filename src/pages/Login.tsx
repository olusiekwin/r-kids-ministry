import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMFA, pendingMFA } = useAuth();
  
  const role = (location.state as { role?: UserRole })?.role || 'parent';
  
  const [email, setEmail] = useState(`${role}@rkids.church`);
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setError('Invalid email or password');
    }
  };

  const handleMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await verifyMFA(mfaCode);
    setLoading(false);

    if (success) {
      navigate(`/${role}`);
    } else {
      setError('Invalid verification code');
    }
  };

  if (pendingMFA) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-medium text-center mb-2">Verify Identity</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the 6-digit code from your authenticator app
          </p>

          <form onSubmit={handleMFA} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Verification Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="input-field text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying...' : '[Verify]'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo code: 123456
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium text-center mb-2">R KIDS Login</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Signing in as {role.charAt(0).toUpperCase() + role.slice(1)}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : '[Login]'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="btn-ghost w-full mt-4"
        >
          [Back to Role Selection]
        </button>
      </div>
    </div>
  );
}

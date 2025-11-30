import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Logo } from '@/components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMFA, pendingMFA, otpCode } = useAuth();
  
  const role = (location.state as { role?: UserRole })?.role || 'parent';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number | null>(null); // Timer in seconds

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOtpTimer(null); // Reset timer

    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setError('Invalid email or password');
    } else if (pendingMFA) {
      // Start 10-minute timer (600 seconds)
      setOtpTimer(600);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (otpTimer !== null && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev === null || prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Video Background */}
        <div className="fixed inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/Rice farm stock video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Portal Container */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            {/* Portal Card */}
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Logo size={80} className="rounded-full" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">R-KIDS</h1>
                <p className="text-sm font-semibold text-white mb-1 drop-shadow-md">Ruach South Assembly</p>
                <p className="text-xs text-white/90 italic mb-4 drop-shadow-sm">Growth Happens Here</p>
                <p className="text-sm text-white/80">Two-factor authentication</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-center mb-2 text-white">Verify Identity</h2>
                  <p className="text-sm text-white/80 text-center">
                    Enter the 6-digit verification code shown below
                  </p>
                </div>

                <form onSubmit={handleMFA} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Verification Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-center text-2xl tracking-widest font-mono text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
                    <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-white">{error}</p>
                    </div>
            )}

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
                    className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

                <div className="pt-6 border-t border-white/20">
                  {otpCode ? (
                    <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg p-4">
                      <p className="text-xs text-white/70 text-center mb-2">Your verification code:</p>
                      <p className="text-3xl font-mono font-bold text-white text-center tracking-widest mb-2">
                        {otpCode}
                      </p>
                      {otpTimer !== null && otpTimer > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xs text-white/60">Expires in:</p>
                          <p className="text-sm font-mono font-semibold text-white">
                            {formatTimer(otpTimer)}
                          </p>
                        </div>
                      ) : otpTimer === 0 ? (
                        <p className="text-xs text-red-300 text-center mt-2">
                          Code expired. Please login again.
                        </p>
                      ) : (
                        <p className="text-xs text-white/60 text-center mt-2">Valid for 10 minutes</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-white/70 text-center">
                      Enter the 6-digit code sent to you
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/Rice farm stock video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Portal Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Portal Card */}
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={80} className="rounded-full" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">R-KIDS</h1>
              <p className="text-sm font-semibold text-white mb-1 drop-shadow-md">Ruach South Assembly</p>
              <p className="text-xs text-white/90 italic mb-4 drop-shadow-sm">Growth Happens Here</p>
              <p className="text-sm text-white/80">
                Signing in as <span className="font-semibold text-white">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
              autoFocus
            />
          </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
            />
          </div>

          {error && (
                <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-white">{error}</p>
                </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
                {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

            <div className="mt-8 pt-6 border-t border-white/20">
        <button
          onClick={() => navigate('/')}
                className="w-full text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
                ← Back to Role Selection
        </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

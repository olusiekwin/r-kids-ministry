import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Logo } from '@/components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMFA, pendingMFA, otpCode } = useAuth();
  
  // Role will be determined from the user's account after login
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number | null>(null); // Timer in seconds

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOtpTimer(null); // Reset timer
    setMfaCode(['', '', '', '', '', '']); // Reset MFA code

    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setError('Invalid email or password');
    }
    // Timer will start automatically via useEffect when pendingMFA becomes true
  };

  // Start timer when MFA screen appears
  useEffect(() => {
    if (pendingMFA && otpTimer === null) {
      setOtpTimer(600); // 10 minutes = 600 seconds
    }
  }, [pendingMFA]);

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

  // Handle MFA code input with separate boxes
  const handleMfaCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newCode = [...mfaCode];
    newCode[index] = digit;
    setMfaCode(newCode);
    setError('');

    // Auto-advance to next box
    if (digit && index < 5) {
      const nextInput = document.getElementById(`mfa-digit-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        // Small delay to let the user see the last digit
        setTimeout(() => {
          handleMFA(new Event('submit') as any);
        }, 100);
      }
    }
  };

  // Handle backspace to go to previous box
  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-digit-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Handle paste
  const handleMfaPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = ['', '', '', '', '', ''];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setMfaCode(newCode);
    setError('');
    
    // Focus on next empty box or last box
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const nextInput = document.getElementById(`mfa-digit-${focusIndex}`) as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  };

  // Format timer as MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMFA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    const code = mfaCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    const success = await verifyMFA(code);
    setLoading(false);

    if (success) {
      // Check if user needs to change password (for newly created admins)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.role) {
        console.error('User or user role not found after login');
        setError('Failed to determine user role. Please try again.');
        return;
      }
      
      // Check if password needs to be changed (for newly created admins)
      const needsPasswordChange = (user.role === 'admin' || user.role === 'super_admin') && 
                                   !user.passwordSet && 
                                   !user.password_set;
      
      if (needsPasswordChange) {
        navigate('/change-password', { replace: true });
        return;
      }
      
      // Check if user needs to update profile (skip for admin/super_admin)
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      const needsProfileUpdate = !isAdmin && user && !user.profile_updated && !user.profileUpdated;
      
      const userRole = user.role;
      
      if (needsProfileUpdate) {
        navigate('/update-profile', { replace: true });
      } else {
        navigate(`/${userRole}`, { replace: true });
      }
    } else {
      setError('Invalid verification code');
      // Clear the code on error
      setMfaCode(['', '', '', '', '', '']);
      // Focus first input
      const firstInput = document.getElementById('mfa-digit-0') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
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
                    <label className="block text-sm font-medium text-white text-center">Verification Code</label>
                    <div className="flex justify-center gap-2" onPaste={handleMfaPaste}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                          key={index}
                          id={`mfa-digit-${index}`}
                type="text"
                          inputMode="numeric"
                          value={mfaCode[index]}
                          onChange={(e) => handleMfaCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleMfaKeyDown(index, e)}
                          className="w-12 h-14 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-center text-2xl tracking-widest font-mono text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                          maxLength={1}
                          autoFocus={index === 0}
                          disabled={loading}
              />
                      ))}
                    </div>
            </div>

            {error && (
                    <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-white">{error}</p>
                    </div>
            )}

            <button
              type="submit"
              disabled={loading || mfaCode.join('').length !== 6}
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
                Sign in with your account credentials
              </p>
              <p className="text-xs text-white/60 mt-2">
                Your role will be automatically determined from your account
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

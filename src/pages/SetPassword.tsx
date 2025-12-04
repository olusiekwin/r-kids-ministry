import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/services/api';
import { Logo } from '@/components/Logo';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const invitationToken = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      setError('Invalid invitation link. Please contact your administrator.');
    }
  }, [email]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: formData.password,
          invitation_token: invitationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      // Password set successfully, check if profile needs to be updated (skip for admin)
      const userData = data.data.user;
      const isAdmin = userData.role === 'admin';
      const needsProfileUpdate = !isAdmin && !userData.profile_updated && !userData.profileUpdated;
      
      if (data.data.requiresMFA) {
        // Store token and OTP for MFA verification
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('temp_otp', data.data.otpCode);
        localStorage.setItem('temp_user', JSON.stringify(data.data.user));
        
        // Redirect to MFA verification, then to profile setup if needed
        navigate('/login', { 
          state: { 
            role: userData.role,
            fromPasswordSetup: true,
            otpCode: data.data.otpCode,
            needsProfileUpdate
          } 
        });
      } else {
        // No MFA required
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to profile setup if needed (skip for admin), otherwise to dashboard
        if (needsProfileUpdate) {
          navigate('/update-profile', { replace: true });
        } else {
          navigate(`/${userData.role}`, { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Set password error:', error);
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

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
              <h1 className="text-2xl font-bold text-white mb-2">Set Your Password</h1>
              <p className="text-sm text-white/80">
                Welcome! Please set a password to continue
              </p>
              {email && (
                <p className="text-xs text-white/60 mt-2 font-mono">{email}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <p className="text-sm text-white">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  placeholder="Enter password (min 8 characters)"
                  required
                />
                {errors.password && (
                  <p className="text-xs text-red-300">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  placeholder="Confirm password"
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-300">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Setting Password...' : 'Set Password & Continue'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-white/60">
                Already have a password?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="underline hover:text-white transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


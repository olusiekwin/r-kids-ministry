import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import { Logo } from '@/components/Logo';

export default function UpdateProfile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  // Parse existing name into first and last name if available
  const parseName = (fullName: string | undefined) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  };

  const nameParts = parseName(user?.name);
  
  const [formData, setFormData] = useState({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: '',
    phoneCountryCode: '+234',
    address: '',
    gender: '',
    relationship: '',
    age: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Country codes for phone dropdown
  const countryCodes = [
    { code: '+234', country: 'Nigeria' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+233', country: 'Ghana' },
    { code: '+254', country: 'Kenya' },
    { code: '+27', country: 'South Africa' },
  ];

  // Gender options (for teachers and teens)
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  // Relationship options (for parents)
  const relationshipOptions = ['Mom', 'Dad', 'Auntie', 'Uncle', 'Grandma', 'Grandpa', 'Guardian', 'Other'];

  // Age options (18-100)
  const ageOptions = Array.from({ length: 83 }, (_, i) => (i + 18).toString());
  
  // Determine if user is a parent
  const isParent = user?.role?.toLowerCase() === 'parent';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }

    // For parents, require relationship; for others, require gender
    if (isParent) {
      if (!formData.relationship) {
        setError('Please select your relationship to the child');
        return;
      }
    } else {
      if (!formData.gender) {
        setError('Please select your gender');
        return;
      }
    }

    if (!formData.age) {
      setError('Please select your age');
      return;
    }

    setLoading(true);
    try {
      // Combine country code with phone number
      const fullPhone = formData.phone 
        ? `${formData.phoneCountryCode}${formData.phone.replace(/^\+?\d+/, '')}` 
        : undefined;

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      const response = await usersApi.updateProfile({
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: fullPhone,
        address: formData.address || undefined,
        gender: isParent ? undefined : formData.gender,
        relationship: isParent ? formData.relationship : undefined,
        age: parseInt(formData.age),
      });
      
      // Update user in context and localStorage
      const updatedUserData = {
        ...user!,
        name: fullName,
        profile_updated: true,
        profileUpdated: true, // Set both for compatibility
        phone: fullPhone,
        address: formData.address || undefined,
        gender: formData.gender,
        age: parseInt(formData.age),
      };
      
      updateUser(updatedUserData);
      
      // Small delay to ensure state is updated, then redirect
      setTimeout(() => {
        if (user?.role === 'teacher') {
          navigate('/teacher', { replace: true });
        } else {
          navigate(`/${user?.role || 'login'}`, { replace: true });
        }
      }, 100);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
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
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={80} className="rounded-full" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-white/80 text-sm">
                Please provide your information to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {isParent ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Relationship to Child *</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  >
                    <option value="" className="text-black">Select relationship</option>
                    {relationshipOptions.map((rel) => (
                      <option key={rel} value={rel} className="text-black">
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  >
                    <option value="" className="text-black">Select gender</option>
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender} className="text-black">
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Age *</label>
                <select
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                >
                  <option value="" className="text-black">Select age</option>
                  {ageOptions.map((age) => (
                    <option key={age} value={age} className="text-black">
                      {age} years
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={formData.phoneCountryCode}
                    onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                    className="px-3 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  >
                    {countryCodes.map(({ code, country }) => (
                      <option key={code} value={code} className="text-black">
                        {code} {country}
                      </option>
                    ))}
                  </select>
                <input
                  type="tel"
                  value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all resize-none"
                  placeholder="Enter your address"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.firstName.trim() || !formData.lastName.trim() || (isParent ? !formData.relationship : !formData.gender) || !formData.age}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

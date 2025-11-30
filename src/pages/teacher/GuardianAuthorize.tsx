import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { childrenApi, checkOutApi } from '@/services/api';
import { Child, Guardian } from '@/types';

export default function GuardianAuthorize() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    if (childId) {
      loadChild();
    }
  }, [childId]);

  const loadChild = async () => {
    try {
      const data = await childrenApi.get(childId!);
      setChild(data);
    } catch (error) {
      console.error('Failed to load child:', error);
    }
  };

  const handleGuardianSelect = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setOtpStep(true);
    // In real app: Send OTP to guardian
  };

  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [guardianPhoto, setGuardianPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGuardian) {
      // Load guardian photo if available
      // In real app, this would come from the guardian's profile
      setGuardianPhoto(null); // Placeholder - would load from API
    }
  }, [selectedGuardian]);

  const handleVerifyOTP = async () => {
    if (!childId || !selectedGuardian) return;
    
    if (!photoConfirmed) {
      setError('Please confirm guardian photo before releasing child.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await checkOutApi.release(childId, selectedGuardian.id, otp);
      alert('Child released successfully! Parent has been notified.');
      navigate('/teacher');
    } catch (error: any) {
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <p className="text-destructive">Child not found</p>
          <button onClick={() => navigate('/teacher')} className="btn-secondary mt-4">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const activeGuardians = child.guardians?.filter(g => g.status === 'active') || [];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Guardian Authorization</h1>
          <p className="text-muted-foreground">Verify guardian identity for {child.name}</p>
        </div>

        {!otpStep ? (
          <div>
            <div className="border border-border rounded-md p-6 mb-6 bg-background shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <PhotoPlaceholder size="lg" />
                <div>
                  <p className="font-mono text-sm text-muted-foreground">{child.registrationId}</p>
                  <p className="text-xl font-semibold">{child.name}</p>
                  <p className="text-sm text-muted-foreground">Age {child.age} • {child.group}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Select Authorized Guardian</h3>
              {activeGuardians.length === 0 ? (
                <p className="text-muted-foreground">No active guardians found</p>
              ) : (
                <div className="space-y-2">
                  {activeGuardians.map((guardian) => (
                    <button
                      key={guardian.id}
                      onClick={() => handleGuardianSelect(guardian)}
                      className="w-full border border-border rounded-md p-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <PhotoPlaceholder size="md" />
                        <div>
                          <p className="font-semibold">{guardian.name}</p>
                          <p className="text-sm text-muted-foreground">{guardian.relationship}</p>
                          {guardian.expiresAt && (
                            <p className="text-xs text-muted-foreground">Expires: {guardian.expiresAt}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-md p-6 bg-background shadow-sm max-w-md">
            <h3 className="font-semibold mb-4">Verify Guardian & Release Child</h3>
            
            {/* Guardian Photo Confirmation */}
            <div className="mb-6 p-4 border border-border rounded-md bg-muted/30">
              <p className="text-sm font-medium mb-3">Guardian Photo Confirmation *</p>
              <div className="flex items-center gap-4 mb-4">
                {guardianPhoto ? (
                  <img src={guardianPhoto} alt={selectedGuardian?.name} className="w-24 h-24 rounded-md object-cover border border-border" />
                ) : (
                  <PhotoPlaceholder size="lg" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{selectedGuardian?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedGuardian?.relationship}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please verify this matches the person picking up the child
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={photoConfirmed}
                  onChange={(e) => setPhotoConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">I confirm this is the authorized guardian</span>
              </label>
            </div>

            {/* OTP Verification */}
            <p className="text-sm text-muted-foreground mb-4">
              OTP sent to {selectedGuardian?.name}
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="input-field text-center text-2xl tracking-widest font-mono mb-4"
              maxLength={6}
            />
            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOtpStep(false);
                  setOtp('');
                  setError('');
                  setPhotoConfirmed(false);
                }}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6 || !photoConfirmed}
                className="btn-primary flex-1"
              >
                {loading ? 'Verifying...' : 'Verify & Release'}
              </button>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/teacher')} className="btn-secondary mt-6">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

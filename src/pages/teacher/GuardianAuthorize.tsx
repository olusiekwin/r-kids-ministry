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

  const handleVerifyOTP = async () => {
    if (!childId || !selectedGuardian) return;
    
    try {
      setLoading(true);
      setError('');
      await checkOutApi.release(childId, selectedGuardian.id, otp);
      alert('Child released successfully!');
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
            <h3 className="font-semibold mb-4">Verify OTP</h3>
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
                }}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
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

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockChildren } from '@/data/mockData';

export default function GuardianAuthorize() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [selectedGuardian, setSelectedGuardian] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const child = mockChildren.find(c => c.registrationId === childId);

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <p className="text-destructive">Child not found: {childId}</p>
          <button onClick={() => navigate('/teacher')} className="btn-secondary mt-4">
            [Back to Dashboard]
          </button>
        </main>
      </div>
    );
  }

  const activeGuardians = child.guardians.filter(g => g.status === 'active');
  const expiredGuardians = child.guardians.filter(g => g.status === 'expired');

  const handleProceedWithOTP = () => {
    if (!selectedGuardian) {
      setError('Please select a guardian');
      return;
    }
    setOtpStep(true);
    setError('');
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (otp === '123456') {
      alert(`Check-in successful! ${child.name} released to ${selectedGuardian}`);
      navigate('/teacher');
    } else {
      setError('Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Guardian Authorization</h2>
        
        {/* Child Info */}
        <div className="card-minimal mb-6">
          <p className="text-sm text-muted-foreground">Child:</p>
          <p className="text-lg font-medium">{child.name} ({child.registrationId})</p>
          <p className="text-sm text-muted-foreground">Group: {child.group} | Age: {child.age}</p>
        </div>

        {!otpStep ? (
          <>
            {/* Guardian List */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Guardians authorized:</p>
              
              <div className="space-y-2">
                {activeGuardians.map((guardian) => (
                  <label
                    key={guardian.id}
                    className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer ${
                      selectedGuardian === guardian.name 
                        ? 'border-foreground bg-muted' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="guardian"
                      value={guardian.name}
                      checked={selectedGuardian === guardian.name}
                      onChange={(e) => setSelectedGuardian(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-success font-medium">✓</span>
                    <div className="flex-1">
                      <p className="font-medium">{guardian.name} ({guardian.relationship})</p>
                      {guardian.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {guardian.expiresAt}
                        </p>
                      )}
                    </div>
                  </label>
                ))}

                {expiredGuardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-sm bg-muted/30 opacity-60"
                  >
                    <span className="w-4"></span>
                    <span className="text-destructive font-medium">✗</span>
                    <div className="flex-1">
                      <p className="font-medium">{guardian.name} ({guardian.relationship})</p>
                      <p className="text-xs text-destructive">Expired</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            <button
              onClick={handleProceedWithOTP}
              disabled={!selectedGuardian}
              className="btn-primary w-full md:w-auto"
            >
              [Proceed with OTP]
            </button>
          </>
        ) : (
          <div className="max-w-md">
            <p className="text-sm text-muted-foreground mb-4">
              Releasing {child.name} to: <strong>{selectedGuardian}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Enter OTP sent to guardian's phone/email
            </p>

            <div className="mb-4">
              <label className="block text-sm mb-1">OTP Code:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="input-field text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Verifying...' : '[Confirm Release]'}
              </button>
              <button
                onClick={() => {
                  setOtpStep(false);
                  setOtp('');
                  setError('');
                }}
                className="btn-ghost"
              >
                [Back to Guardian Selection]
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Demo OTP: 123456
            </p>
          </div>
        )}
      </main>

      <div className="fixed-bottom-action md:hidden">
        <button onClick={() => navigate('/teacher')} className="btn-secondary w-full">
          [Cancel]
        </button>
      </div>

      <MobileNav />
    </div>
  );
}

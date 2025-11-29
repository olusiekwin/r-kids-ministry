import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

export default function ManualCheckIn() {
  const navigate = useNavigate();
  const [parentId, setParentId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!parentId.trim()) {
      setError('Please enter a Parent ID');
      return;
    }

    setLoading(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (otp === '123456') {
      navigate('/teacher/authorize/RS073/01');
    } else {
      setError('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Manual Check-In</h2>
        
        {!otpSent ? (
          <div className="max-w-md">
            <div className="mb-4">
              <label className="block text-sm mb-1">Enter Parent ID:</label>
              <input
                type="text"
                value={parentId}
                onChange={(e) => setParentId(e.target.value.toUpperCase())}
                placeholder="e.g., RS073"
                className="input-field font-mono"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="max-w-md">
            <p className="text-sm text-muted-foreground mb-4">
              OTP sent to registered phone/email for {parentId}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm mb-1">Enter OTP:</label>
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
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                className="btn-ghost"
              >
                Enter Different Parent ID
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
          Back to Dashboard
        </button>
      </div>

      <MobileNav />
    </div>
  );
}

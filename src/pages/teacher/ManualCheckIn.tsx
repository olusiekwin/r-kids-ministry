import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeacherSidebar } from '@/components/TeacherSidebar';

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
      <TeacherSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Manual Check-In</h1>
            <p className="text-muted-foreground">Enter Parent ID to send OTP</p>
          </div>
        
        {!otpSent ? (
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Enter Parent ID:</label>
              <input
                type="text"
                value={parentId}
                onChange={(e) => setParentId(e.target.value.toUpperCase())}
                placeholder="e.g., RS073"
                    className="input-field font-mono w-full"
                autoFocus
              />
            </div>

            {error && (
                  <div className="bg-muted border border-border rounded-md p-4">
                    <p className="text-sm text-foreground">{error}</p>
                  </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
              </div>
          </div>
        ) : (
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground text-center">
              OTP sent to registered phone/email for {parentId}
            </p>
            
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Enter OTP:</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input-field text-center text-2xl tracking-widest font-mono w-full"
                maxLength={6}
                autoFocus
              />
            </div>

            {error && (
                  <div className="bg-muted border border-border rounded-md p-4">
                    <p className="text-sm text-foreground">{error}</p>
                  </div>
            )}

                <div className="space-y-3">
              <button
                onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                    className="btn-ghost w-full text-sm"
              >
                Enter Different Parent ID
              </button>
            </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Demo OTP: <span className="font-mono font-semibold">123456</span>
            </p>
                </div>
              </div>
          </div>
        )}
        </div>
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

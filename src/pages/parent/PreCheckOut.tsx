import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { ParentSidebar } from '@/components/ParentSidebar';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { childrenApi, checkOutApi } from '@/services/api';
import { Child } from '@/types';

export default function PreCheckOut() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [method, setMethod] = useState<'qr' | 'otp' | null>(null);
  const [otp, setOtp] = useState<string>('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!childId) return;
    
    try {
      setLoading(true);
      const response = await checkOutApi.generatePickupCode(childId);
      setOtp(response.otp);
      setQrGenerated(true);
      setMethod('qr');
    } catch (error) {
      console.error('Failed to generate QR:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ParentSidebar />
        <main className="md:ml-64 container py-6 px-4 md:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ParentSidebar />
        <main className="md:ml-64 container py-6 px-4 md:px-6 lg:px-8">
          <p className="text-destructive">Child not found</p>
          <button onClick={() => navigate('/parent')} className="btn-secondary mt-4">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <ParentSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Pre-Check-Out</h1>
          <p className="text-muted-foreground">Generate pickup code for {child.name}</p>
        </div>

        {!method ? (
          <div className="border border-border rounded-md p-6 bg-background shadow-sm max-w-md">
            <p className="mb-4">Choose pickup method:</p>
            <div className="space-y-2">
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
              <button
                onClick={() => setMethod('otp')}
                className="btn-secondary w-full"
              >
                Receive OTP Code
              </button>
            </div>
          </div>
        ) : method === 'qr' && qrGenerated ? (
          <div className="border border-border rounded-md p-6 bg-background shadow-sm max-w-md">
            <h3 className="font-semibold mb-4">Your Pickup QR Code</h3>
            <div className="flex justify-center mb-4">
              <QRCodeGenerator value={`pickup_${childId}`} size={200} />
            </div>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">Or use OTP:</p>
              <p className="text-2xl font-mono font-bold">{otp}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Show this QR code or OTP to the teacher at pickup.
            </p>
            <button
              onClick={() => navigate('/parent')}
              className="btn-secondary w-full"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-md p-6 bg-background shadow-sm max-w-md">
            <h3 className="font-semibold mb-4">OTP Code</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your OTP code will be sent via SMS and email.
            </p>
            <button
              onClick={() => {
                setMethod(null);
                setOtp('');
                setQrGenerated(false);
              }}
              className="btn-secondary w-full"
            >
              Back
            </button>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

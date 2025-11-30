import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { childrenApi, checkOutApi } from '@/services/api';
import { Child } from '@/types';

export default function SendPickupNotification() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [loading, setLoading] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const [pickupQR, setPickupQR] = useState<string>('');
  const [pickupOTP, setPickupOTP] = useState<string>('');

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

  const handleSendNotification = async () => {
    if (!childId) return;
    
    try {
      setLoading(true);
      const response = await checkOutApi.sendNotification(childId);
      setPickupQR(response.parent_qr);
      setPickupOTP(response.otp);
      setNotificationSent(true);
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Send Pickup Notification</h1>
          <p className="text-muted-foreground">Notify parent that {child.name} is ready for pickup</p>
        </div>

        {!notificationSent ? (
          <div className="border border-border rounded-md p-6 bg-background shadow-sm max-w-md">
            <p className="mb-4">Send pickup notification to parent for:</p>
            <p className="font-semibold mb-6">{child.name} ({child.registrationId})</p>
            <button
              onClick={handleSendNotification}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Pickup Notification'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted border border-border rounded-md p-4">
              <p className="text-sm font-semibold mb-2">Notification sent successfully!</p>
              <p className="text-sm text-muted-foreground">
                Parent has been notified via email and SMS.
              </p>
            </div>

            <div className="border border-border rounded-md p-6 bg-background shadow-sm">
              <h3 className="font-semibold mb-4">Teacher QR Code (for parent to scan)</h3>
              <div className="flex justify-center mb-4">
                <QRCodeGenerator value={pickupQR} size={200} />
              </div>
            </div>

            <div className="border border-border rounded-md p-6 bg-background shadow-sm">
              <h3 className="font-semibold mb-4">Parent Pickup Code</h3>
              <div className="flex justify-center mb-4">
                <QRCodeGenerator value={pickupQR} size={200} />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or use OTP:</p>
                <p className="text-2xl font-mono font-bold">{pickupOTP}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/teacher')}
              className="btn-secondary w-full"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

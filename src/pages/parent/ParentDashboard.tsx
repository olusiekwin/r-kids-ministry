import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { mockChildren } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preCheckedIn, setPreCheckedIn] = useState<string[]>([]);
  const [showQR, setShowQR] = useState<string | null>(null);

  // Filter children for current parent (using mock data)
  const myChildren = mockChildren.filter(child => child.parentId === '3');

  const handlePreCheckIn = (childId: string) => {
    setPreCheckedIn([...preCheckedIn, childId]);
    setShowQR(childId);
    // In real app, would send email with QR code
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Parent Dashboard</h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          Welcome, {user?.name}. Manage your children's check-in and attendance below.
        </p>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-sm max-w-sm w-full border border-border">
              <h3 className="text-lg font-medium mb-4">QR Code Generated</h3>
              <div className="flex justify-center mb-4">
                <QRCodeDisplay value={showQR} />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                [Email Sent] - QR code has been sent to your registered email.
              </p>
              <button
                onClick={() => setShowQR(null)}
                className="btn-primary w-full"
              >
                [Close]
              </button>
            </div>
          </div>
        )}

        {/* Children List */}
        <div className="space-y-4">
          {myChildren.map((child) => {
            const isPreCheckedIn = preCheckedIn.includes(child.registrationId);
            
            return (
              <div key={child.id} className="border border-border rounded-sm">
                <div className="flex items-start gap-4 p-4">
                  <PhotoPlaceholder size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-muted-foreground">
                      {child.registrationId}
                    </p>
                    <p className="text-lg font-medium">
                      {child.name} ({child.age})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Group: {child.group}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 p-4 pt-0 border-t border-border mt-4">
                  {isPreCheckedIn ? (
                    <button
                      onClick={() => setShowQR(child.registrationId)}
                      className="btn-secondary flex-1"
                    >
                      [View QR Code]
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePreCheckIn(child.registrationId)}
                      className="btn-primary flex-1"
                    >
                      [Pre-Check-In]
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/parent/child/${child.registrationId}`)}
                    className="btn-secondary flex-1"
                  >
                    [View Profile]
                  </button>
                  <button
                    onClick={() => navigate('/parent/attendance')}
                    className="btn-ghost flex-1"
                  >
                    [Attendance]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

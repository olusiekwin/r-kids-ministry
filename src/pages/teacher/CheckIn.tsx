import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { QRCodeScanner } from '@/components/QRCodeScanner';

export default function CheckIn() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const handleScanSuccess = (decodedText: string) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      if (qrData.type === 'checkin' && qrData.childId) {
        setScannedCode(qrData.childId);
        setTimeout(() => {
          navigate(`/teacher/authorize/${qrData.childId}`);
        }, 1000);
      } else {
        // Fallback: try to use the decoded text as child ID
        setScannedCode(decodedText);
        setTimeout(() => {
          navigate(`/teacher/authorize/${decodedText}`);
        }, 1000);
      }
    } catch (err) {
      // If not JSON, treat as direct child ID
      setScannedCode(decodedText);
      setTimeout(() => {
        navigate(`/teacher/authorize/${decodedText}`);
      }, 1000);
    }
  };

  const handleScanError = (error: string) => {
    alert(`Scanning error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">QR Code Check-In</h1>
            <p className="text-muted-foreground">Scan parent's QR code to check in child</p>
          </div>
          
          {scannedCode ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold mb-3">QR Code Scanned</p>
              <p className="font-mono text-xl mb-4">{scannedCode}</p>
              <p className="text-sm text-muted-foreground">Redirecting to authorization...</p>
            </div>
          ) : showScanner ? (
            <QRCodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={() => setShowScanner(false)}
            />
          ) : (
            <div className="text-center py-12 space-y-6">
              <p className="text-muted-foreground">
                Tap below to open camera and scan QR code
              </p>
              <button 
                onClick={() => setShowScanner(true)} 
                className="btn-primary px-8"
              >
                Scan QR Code
              </button>
              <div className="pt-6 border-t border-border">
                <button 
                  onClick={() => navigate('/teacher/manual-checkin')}
                  className="btn-ghost text-sm"
                >
                  Use Manual Check-in Instead
                </button>
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


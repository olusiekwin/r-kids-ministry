import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

export default function CheckIn() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const simulateSuccessfulScan = () => {
    stopScanner();
    setResult('RS073/01');
    setTimeout(() => {
      navigate('/teacher/authorize/RS073/01');
    }, 1500);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">QR Code Check-In</h2>
        
        {result ? (
          <div className="text-center py-8">
            <p className="text-lg font-medium mb-2">QR Code Scanned</p>
            <p className="font-mono text-xl">{result}</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to authorization...</p>
          </div>
        ) : scanning ? (
          <div className="space-y-4">
            <div className="border border-border rounded-sm overflow-hidden aspect-square max-w-md mx-auto bg-foreground">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Point camera at parent's QR code
            </p>
            <div className="flex flex-col gap-2 max-w-md mx-auto">
              <button onClick={simulateSuccessfulScan} className="btn-primary">
                [Simulate Successful Scan]
              </button>
              <button onClick={stopScanner} className="btn-secondary">
                [Stop Scanner]
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Tap below to open camera and scan QR code
            </p>
            <button onClick={startScanner} className="btn-primary">
              [Scan QR]
            </button>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-border">
          <button 
            onClick={() => navigate('/teacher/manual-checkin')}
            className="btn-ghost"
          >
            [Use Manual Check-in Instead]
          </button>
        </div>
      </main>

      <div className="fixed-bottom-action md:hidden">
        <button onClick={() => navigate('/teacher')} className="btn-secondary w-full">
          [Back to Dashboard]
        </button>
      </div>

      <MobileNav />
    </div>
  );
}

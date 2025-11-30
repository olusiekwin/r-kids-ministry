import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle2 } from 'lucide-react';

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  fps?: number;
}

export function QRCodeScanner({
  onScanSuccess,
  onScanError,
  onClose,
  fps = 10,
}: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedCode(decodedText);
          setScanning(false);
          html5QrCode.stop();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      if (onScanError) {
        onScanError(err.message || 'Failed to start camera');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = async () => {
    await stopScanning();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/90 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-sm border border-border p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <button
            onClick={handleClose}
            className="btn-ghost btn-sm p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {scannedCode ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">QR Code Scanned!</p>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              {scannedCode}
            </p>
            <button
              onClick={() => {
                setScannedCode(null);
                startScanning();
              }}
              className="btn-primary"
            >
              Scan Another
            </button>
          </div>
        ) : (
          <>
            <div
              id={containerId}
              className="w-full aspect-square border border-border rounded-sm mb-4"
            />
            {!scanning && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={startScanning}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Point camera at QR code
                </p>
              </div>
            )}
            {scanning && (
              <button
                onClick={stopScanning}
                className="btn-secondary w-full"
              >
                Stop Scanning
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}


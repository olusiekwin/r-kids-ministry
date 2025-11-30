import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2 } from 'lucide-react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  showDownload?: boolean;
  showShare?: boolean;
  title?: string;
}

export function QRCodeGenerator({ 
  value, 
  size = 300, 
  showDownload = true,
  showShare = true,
  title 
}: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        const dataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (value) {
      generateQR();
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${value.replace(/\//g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;

    if (navigator.share) {
      try {
        const blob = await fetch(qrDataUrl).then(r => r.blob());
        const file = new File([blob], `qr-code-${value}.png`, { type: 'image/png' });
        await navigator.share({
          title: 'R KIDS Check-In QR Code',
          text: `QR Code for ${value}`,
          files: [file],
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard or download
      handleDownload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Generating QR code...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {title && (
        <h3 className="text-lg font-medium">{title}</h3>
      )}
      <div className="border border-border rounded-sm p-4 bg-background">
        <img 
          src={qrDataUrl} 
          alt={`QR Code for ${value}`}
          className="w-full h-full"
          style={{ width: size, height: size }}
        />
      </div>
      <p className="font-mono text-sm text-muted-foreground text-center">
        {value}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Valid for 15 minutes
      </p>
      <div className="flex gap-2">
        {showDownload && (
          <button
            onClick={handleDownload}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        {showShare && navigator.share && (
          <button
            onClick={handleShare}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>
    </div>
  );
}


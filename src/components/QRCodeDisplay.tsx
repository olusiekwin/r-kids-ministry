import { QRCodeGenerator } from './QRCodeGenerator';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showDownload?: boolean;
  showShare?: boolean;
  title?: string;
}

export function QRCodeDisplay({ 
  value, 
  size = 200,
  showDownload = true,
  showShare = true,
  title 
}: QRCodeDisplayProps) {
  return (
    <QRCodeGenerator
      value={value}
      size={size}
      showDownload={showDownload}
      showShare={showShare}
      title={title}
    />
  );
}

interface QRCodeDisplayProps {
  value: string;
}

export function QRCodeDisplay({ value }: QRCodeDisplayProps) {
  // ASCII art QR code placeholder
  return (
    <div className="border border-border p-4 bg-background inline-block">
      <pre className="text-[6px] leading-[6px] font-mono select-none">
{`██████████████  ████  ██████████████
██          ██  ████  ██          ██
██  ██████  ██    ██  ██  ██████  ██
██  ██████  ██  ████  ██  ██████  ██
██  ██████  ██  ██    ██  ██████  ██
██          ██        ██          ██
██████████████  ██  ████████████████
                ██                  
██████  ██████████████  ████████████
    ██  ██      ██  ██    ██  ██    
████  ████  ██  ██████████    ██████
██  ██      ██████      ██    ██    
██████████████      ██████  ████████
                ██  ██    ██  ██  ██
██████████████  ████████████████████
██          ██    ██████  ██      ██
██  ██████  ██  ██  ██████  ████████
██  ██████  ██    ████    ██████  ██
██  ██████  ██  ██████████    ██████
██          ██  ██  ██  ██████    ██
██████████████  ██████    ██████████`}
      </pre>
      <p className="text-xs text-muted-foreground mt-2 text-center">{value}</p>
    </div>
  );
}

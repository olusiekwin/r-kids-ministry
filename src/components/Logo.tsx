import { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function Logo({ size = 200, className, ...props }: LogoProps) {
  return (
    <img
      src="/a5235d2c-5376-4e2f-9c00-675e66ecdefd.jpg"
      alt="R-KIDS Logo - Ruach South Assembly"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}


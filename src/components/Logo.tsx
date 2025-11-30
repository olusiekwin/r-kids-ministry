import { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function Logo({ size = 200, className, ...props }: LogoProps) {
  return (
    <img
      src="/logo.jpg"
      alt="R-KIDS Logo - Ruach South Assembly"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}


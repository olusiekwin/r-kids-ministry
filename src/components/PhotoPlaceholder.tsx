import { cn } from '@/lib/utils';

interface PhotoPlaceholderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PhotoPlaceholder({ size = 'md', className }: PhotoPlaceholderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[8px]',
    md: 'w-12 h-12 text-[10px]',
    lg: 'w-20 h-20 text-xs',
  };

  return (
    <div className={cn('photo-placeholder', sizeClasses[size], className)}>
      [PHOTO]
    </div>
  );
}

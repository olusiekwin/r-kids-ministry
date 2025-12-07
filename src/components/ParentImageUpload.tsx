import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParentImageUploadProps {
  currentImageUrl?: string | null;
  parentName?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  maxSize?: number; // in bytes
  accept?: string[];
  size?: number; // Size in pixels (default 120)
  disabled?: boolean;
  className?: string;
}

// Get initials from name
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParentImageUpload({
  currentImageUrl,
  parentName = '',
  onUpload,
  onRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  size = 120,
  disabled = false,
  className,
}: ParentImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes
  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP image.');
        }

        // Validate file size
        if (file.size > maxSize) {
          throw new Error(`File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        await onUpload(file);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image');
        setPreview(currentImageUrl || null); // Revert preview
      } finally {
        setUploading(false);
      }
    },
    [onUpload, maxSize, currentImageUrl]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled || uploading) return;

      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload JPEG, PNG, or WebP image.');
        } else {
          setError('Failed to upload file');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    [handleFileUpload, maxSize, disabled, uploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    disabled: disabled || uploading,
  });

  const handleRemove = async () => {
    if (disabled || uploading) return;
    
    if (onRemove) {
      setUploading(true);
      try {
        await onRemove();
        setPreview(null);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to remove image');
      } finally {
        setUploading(false);
      }
    } else {
      setPreview(null);
      setError(null);
    }
  };

  const borderRadius = Math.min(size * 0.1, 12); // 8-12px based on size

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {preview ? (
        <div className="relative group">
          <div
            className={cn(
              'relative overflow-hidden bg-muted flex items-center justify-center',
              'transition-all duration-200',
              !disabled && !uploading && 'cursor-pointer hover:opacity-90',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: `${borderRadius}px`,
            }}
            onClick={() => {
              if (!disabled && !uploading && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <img
              src={preview}
              alt={parentName ? `Parent image for ${parentName}` : 'Parent image'}
              className="w-full h-full object-cover"
              style={{ borderRadius: `${borderRadius}px` }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {!disabled && !uploading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          {!disabled && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={uploading}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
              // Reset input
              if (e.target) {
                e.target.value = '';
              }
            }}
            disabled={disabled || uploading}
            className="hidden"
          />
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'relative overflow-hidden flex items-center justify-center',
            'transition-all duration-200',
            disabled || uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            isDragActive && 'ring-2 ring-primary ring-offset-2'
          )}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
          }}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div
            className={cn(
              'w-full h-full flex flex-col items-center justify-center gap-2',
              'bg-muted border-2 border-dashed transition-colors',
              isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            )}
            style={{ borderRadius: `${borderRadius}px` }}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                {parentName ? (
                  <div className="text-2xl font-semibold text-muted-foreground">
                    {getInitials(parentName)}
                  </div>
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground text-center px-2">
                  {isDragActive ? 'Drop image' : 'Upload'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive text-center max-w-[200px]">{error}</p>
      )}
      {!error && !preview && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          JPEG, PNG, or WebP (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
        </p>
      )}
    </div>
  );
}


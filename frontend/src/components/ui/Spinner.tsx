'use client';

import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function Spinner({ size = 32, className = '', label }: SpinnerProps) {
  return (
    <div className={`page-spinner flex-col gap-3 ${className}`}>
      <Loader2 size={size} className="animate-spin text-primary-500" />
      {label && <p className="text-caption text-surface-400">{label}</p>}
    </div>
  );
}

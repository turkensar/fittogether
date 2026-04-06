'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ message = 'Bir hata oluştu. Lütfen tekrar dene.', onRetry }: ErrorAlertProps) {
  return (
    <div className="error-banner animate-fade-in">
      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 text-caption font-semibold hover:underline">
            <RefreshCw size={12} /> Tekrar dene
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import AppShell from './AppShell';

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
  withShell?: boolean;
}

export default function PageError({ message = 'Sayfa y\u00FCklenemedi.', onRetry, withShell = true }: PageErrorProps) {
  const content = (
    <div className="flex flex-col items-center justify-center pt-20 text-center px-6 animate-fade-in">
      <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-danger" />
      </div>
      <h2 className="text-heading mb-2">Bir \u015Feyler ters gitti</h2>
      <p className="text-body text-surface-400 mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
          <RefreshCw size={16} /> Tekrar Dene
        </button>
      )}
    </div>
  );

  return withShell ? <AppShell>{content}</AppShell> : content;
}

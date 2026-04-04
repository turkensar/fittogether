'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PairingStatus } from '@/types';

export default function PairingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<PairingStatus | null>(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<PairingStatus>('/api/pairing/status').then(setStatus);
  }, []);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/pairing/match', { partner_code: partnerCode.trim().toUpperCase() });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (status?.invite_code) {
      navigator.clipboard.writeText(status.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status?.paired) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-lg mx-auto pt-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💕</div>
          <h1 className="text-2xl font-bold">Find Your Partner</h1>
          <p className="text-gray-500 text-sm mt-1">Share your code or enter your partner's code to match</p>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-3">Your Invite Code</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-primary-50 dark:bg-primary-900/30 px-4 py-3 rounded-xl font-mono text-2xl text-center font-bold tracking-widest text-primary-600 dark:text-primary-300">
              {status?.invite_code || '...'}
            </div>
            <button onClick={copyCode} className="btn-secondary px-4">
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this code with your partner</p>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-3">Enter Partner's Code</h2>
          <form onSubmit={handleMatch} className="space-y-4">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">{error}</div>}
            <input
              type="text"
              className="input-field font-mono text-center text-xl tracking-widest uppercase"
              placeholder="ABCD1234"
              value={partnerCode}
              onChange={e => setPartnerCode(e.target.value)}
              maxLength={8}
              required
            />
            <button type="submit" className="btn-accent w-full" disabled={loading}>
              {loading ? 'Matching...' : 'Match with Partner'}
            </button>
          </form>
        </div>

        <button onClick={() => router.push('/dashboard')} className="w-full text-center text-gray-400 text-sm mt-6 hover:text-gray-600">
          Skip for now
        </button>
      </div>
    </div>
  );
}

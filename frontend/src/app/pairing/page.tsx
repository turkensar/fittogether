'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PairingStatus } from '@/types';
import { Heart, Copy, Check, Users, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

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

  if (status?.paired) { router.push('/dashboard'); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-900 dark:to-surface-800 p-4">
      <div className="max-w-lg mx-auto pt-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart size={28} className="text-accent-500" />
          </div>
          <h1 className="text-heading">Find Your Partner</h1>
          <p className="text-caption text-surface-400 mt-1">Share your code or enter your partner's code</p>
        </div>

        <div className="card p-6 mb-4">
          <h2 className="section-title mb-3"><Copy size={16} /> Your Invite Code</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 rounded-btn font-mono text-2xl text-center font-bold tracking-widest text-primary-600 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
              {status?.invite_code || '...'}
            </div>
            <button onClick={copyCode} className="btn-secondary px-4 py-3 flex items-center gap-1.5">
              {copied ? <><Check size={16} className="text-success" /> Copied</> : <><Copy size={16} /> Copy</>}
            </button>
          </div>
          <p className="text-micro text-surface-400 mt-2">Share this code with your partner</p>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-3"><Users size={16} /> Enter Partner's Code</h2>
          <form onSubmit={handleMatch} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 bg-danger/5 text-danger p-3 rounded-btn text-body">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <input
              type="text"
              className="input-field font-mono text-center text-xl tracking-widest uppercase"
              placeholder="ABCD1234"
              value={partnerCode}
              onChange={e => setPartnerCode(e.target.value)}
              maxLength={8}
              required
            />
            <button type="submit" className="btn-accent w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Match with Partner</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <button onClick={() => router.push('/dashboard')} className="w-full text-center text-surface-400 text-caption mt-6 hover:text-surface-600">
          Skip for now
        </button>
      </div>
    </div>
  );
}

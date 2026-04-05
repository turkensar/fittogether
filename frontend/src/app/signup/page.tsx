'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-900 dark:to-surface-800 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart size={24} className="text-accent-500" />
          </div>
          <h1 className="text-heading text-primary-500">Join FitTogether</h1>
          <p className="text-caption text-surface-400 mt-1">Start your couples diet journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-danger/5 text-danger p-3 rounded-btn text-body">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-caption font-semibold mb-1">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" className="input-field pl-9" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="email" className="input-field pl-9" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="password" className="input-field pl-9" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-caption text-surface-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-500 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

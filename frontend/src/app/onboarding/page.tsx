'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

const EMOJIS = ['😊', '💪', '🔥', '🌟', '🦋', '🌸', '🎯', '🏋️', '🧘', '❤️'];
const COLORS = ['#7c5cfc', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#8b5cf6'];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    age: '', height: '', current_weight: '', target_weight: '',
    gender: '', daily_calorie_goal: '2000', avatar_emoji: '😊', avatar_color: '#7c5cfc',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        current_weight: form.current_weight ? parseFloat(form.current_weight) : null,
        target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
        gender: form.gender || null,
        daily_calorie_goal: parseInt(form.daily_calorie_goal) || 2000,
        avatar_emoji: form.avatar_emoji,
        avatar_color: form.avatar_color,
      };
      const updated = await api.put<User>('/api/auth/profile', data);
      updateUser(updated);
      router.push('/pairing');
    } catch { alert('Failed to save profile'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-900 dark:to-surface-800 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles size={24} className="text-primary-500" />
          </div>
          <h1 className="text-heading">Set Up Your Profile</h1>
          <p className="text-caption text-surface-400 mt-1">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Avatar */}
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
              style={{ backgroundColor: form.avatar_color + '22' }}>
              {form.avatar_emoji}
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap mb-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm(f => ({ ...f, avatar_emoji: e }))}
                  className={`text-xl p-1 rounded-btn ${form.avatar_emoji === e ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-300' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 justify-center">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                  className={`w-6 h-6 rounded-full transition-all ${form.avatar_color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-semibold mb-1">Age</label>
              <input type="number" className="input-field" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <label className="block text-caption font-semibold mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold mb-1">Height (cm)</label>
            <input type="number" className="input-field" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} step="0.1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-semibold mb-1">Current Weight (kg)</label>
              <input type="number" className="input-field" value={form.current_weight} onChange={e => setForm(f => ({ ...f, current_weight: e.target.value }))} step="0.1" />
            </div>
            <div>
              <label className="block text-caption font-semibold mb-1">Target Weight (kg)</label>
              <input type="number" className="input-field" value={form.target_weight} onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} step="0.1" />
            </div>
          </div>

          <div>
            <label className="block text-caption font-semibold mb-1">Daily Calorie Goal</label>
            <input type="number" className="input-field" value={form.daily_calorie_goal} onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Continue</span><ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

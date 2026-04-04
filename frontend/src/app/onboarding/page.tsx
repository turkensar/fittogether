'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';

const EMOJIS = ['😊', '💪', '🔥', '🌟', '🦋', '🌸', '🎯', '🏋️', '🧘', '❤️'];
const COLORS = ['#6C63FF', '#FF6B8A', '#4ECDC4', '#FFD93D', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7'];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    age: '',
    height: '',
    current_weight: '',
    target_weight: '',
    gender: '',
    daily_calorie_goal: '2000',
    avatar_emoji: '😊',
    avatar_color: '#6C63FF',
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
    } catch {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-lg mx-auto pt-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Tell us about yourself so we can help you better</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="text-center mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-3"
              style={{ backgroundColor: form.avatar_color + '33' }}
            >
              {form.avatar_emoji}
            </div>
            <div className="flex gap-2 justify-center flex-wrap mb-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm(f => ({ ...f, avatar_emoji: e }))}
                  className={`text-2xl p-1 rounded-lg ${form.avatar_emoji === e ? 'bg-primary-100 dark:bg-primary-900' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                  className={`w-7 h-7 rounded-full ${form.avatar_color === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input type="number" className="input-field" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Height (cm)</label>
            <input type="number" className="input-field" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} step="0.1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Weight (kg)</label>
              <input type="number" className="input-field" value={form.current_weight} onChange={e => setForm(f => ({ ...f, current_weight: e.target.value }))} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Weight (kg)</label>
              <input type="number" className="input-field" value={form.target_weight} onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} step="0.1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Daily Calorie Goal</label>
            <input type="number" className="input-field" value={form.daily_calorie_goal} onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

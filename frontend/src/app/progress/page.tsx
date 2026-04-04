'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { WeightProgress, Badge as BadgeType } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myProgress, setMyProgress] = useState<WeightProgress | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<any>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<WeightProgress>('/api/tracking/weight/progress').then(setMyProgress);
      api.get('/api/tracking/weight/partner-progress').then(setPartnerProgress).catch(() => {});
      api.get<BadgeType[]>('/api/gamification/badges').then(setBadges);
      api.get('/api/gamification/leaderboard').then(setLeaderboard);
    }
  }, [user, authLoading]);

  const logWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    setLogging(true);
    try {
      await api.post('/api/tracking/weight', { weight: parseFloat(weight) });
      setWeight('');
      const updated = await api.get<WeightProgress>('/api/tracking/weight/progress');
      setMyProgress(updated);
    } catch {}
    setLogging(false);
  };

  if (authLoading || !myProgress) {
    return <AppShell><div className="flex justify-center pt-20"><div className="animate-spin text-4xl">💫</div></div></AppShell>;
  }

  const chartData = myProgress.logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    weight: l.weight,
  }));

  return (
    <AppShell>
      <div className="space-y-4 pb-4">
        <h1 className="text-xl font-bold">📊 Progress</h1>

        {/* Weight summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Weight Journey</h3>
            <span className="text-sm text-primary-500 font-bold">{myProgress.percentage}%</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Start</p>
              <p className="font-bold">{myProgress.start_weight} kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Current</p>
              <p className="font-bold text-primary-500">{myProgress.current_weight} kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Target</p>
              <p className="font-bold text-green-500">{myProgress.target_weight} kg</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 mb-2">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-1"
              style={{ width: `${Math.min(100, myProgress.percentage)}%` }}>
              {myProgress.percentage > 10 && <span className="text-[9px] text-white font-bold">{myProgress.lost}kg</span>}
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">Lost {myProgress.lost} kg so far!</p>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-3">Weight Over Time</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#6C63FF" strokeWidth={2} dot={{ fill: '#6C63FF', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Log weight */}
        <div className="card">
          <h3 className="font-semibold mb-3">Log Weight</h3>
          <form onSubmit={logWeight} className="flex gap-2">
            <input type="number" step="0.1" className="input-field flex-1" placeholder="Weight in kg"
              value={weight} onChange={e => setWeight(e.target.value)} required />
            <button type="submit" className="btn-primary px-6" disabled={logging}>
              {logging ? '...' : 'Log'}
            </button>
          </form>
        </div>

        {/* Partner progress */}
        {partnerProgress && (
          <div className="card bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/10 dark:to-primary-900/10">
            <h3 className="font-semibold mb-2">Partner: {partnerProgress.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Start</p>
                <p className="font-bold text-sm">{partnerProgress.start_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Current</p>
                <p className="font-bold text-sm text-accent-500">{partnerProgress.current_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Lost</p>
                <p className="font-bold text-sm text-green-500">{partnerProgress.lost} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Couple leaderboard */}
        {leaderboard && leaderboard.partner_name && (
          <div className="card">
            <h3 className="font-semibold mb-3">🏆 Couple Leaderboard</h3>
            <div className="space-y-2">
              {[
                { name: user?.name || 'Me', score: leaderboard.my_score, emoji: user?.avatar_emoji },
                { name: leaderboard.partner_name, score: leaderboard.partner_score, emoji: '💕' },
              ]
                .sort((a, b) => b.score - a.score)
                .map((entry, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <span className="text-lg font-bold text-gray-300">{i + 1}</span>
                    <span className="text-xl">{entry.emoji}</span>
                    <span className="flex-1 font-medium text-sm">{entry.name}</span>
                    <span className="font-bold text-primary-500">{entry.score} pts</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="card">
          <h3 className="font-semibold mb-3">🎖️ Badges</h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map(badge => (
              <div key={badge.id}
                className={`text-center p-3 rounded-xl ${badge.earned_at ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700 opacity-50'}`}>
                <div className="text-2xl mb-1">{badge.emoji}</div>
                <p className="text-[10px] font-medium">{badge.name}</p>
                {badge.earned_at && <p className="text-[9px] text-green-500">Earned!</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

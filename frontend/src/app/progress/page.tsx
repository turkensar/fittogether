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
import {
  TrendingUp, Scale, Trophy, Award, Users, Loader2, Lock,
} from 'lucide-react';

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
    return <AppShell><div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div></AppShell>;
  }

  const chartData = myProgress.logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    weight: l.weight,
  }));

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" />
          <h1 className="text-heading">Progress</h1>
        </div>

        {/* Weight summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title"><Scale size={16} /> My Weight Journey</h3>
            <span className="text-caption text-primary-500 font-bold">{myProgress.percentage}%</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="stat-label">Start</p>
              <p className="text-body font-bold">{myProgress.start_weight} kg</p>
            </div>
            <div className="text-center">
              <p className="stat-label">Current</p>
              <p className="text-body font-bold text-primary-500">{myProgress.current_weight} kg</p>
            </div>
            <div className="text-center">
              <p className="stat-label">Target</p>
              <p className="text-body font-bold text-success">{myProgress.target_weight} kg</p>
            </div>
          </div>

          <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-3 mb-1.5">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-1"
              style={{ width: `${Math.min(100, myProgress.percentage)}%` }}>
              {myProgress.percentage > 15 && <span className="text-[8px] text-white font-bold">{myProgress.lost}kg</span>}
            </div>
          </div>
          <p className="text-micro text-surface-400 text-center">Lost {myProgress.lost} kg so far!</p>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="card">
            <h3 className="section-title mb-3">Weight Over Time</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#7c5cfc" strokeWidth={2} dot={{ fill: '#7c5cfc', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Log weight */}
        <div className="card">
          <h3 className="section-title mb-3"><Scale size={16} /> Log Weight</h3>
          <form onSubmit={logWeight} className="flex gap-2">
            <input type="number" step="0.1" className="input-field flex-1" placeholder="Weight in kg"
              value={weight} onChange={e => setWeight(e.target.value)} required />
            <button type="submit" className="btn-primary px-6" disabled={logging}>
              {logging ? <Loader2 size={16} className="animate-spin" /> : 'Log'}
            </button>
          </form>
        </div>

        {/* Partner progress */}
        {partnerProgress && (
          <div className="card bg-accent-50/50 dark:bg-accent-900/10 border-accent-100 dark:border-accent-900/30">
            <h3 className="section-title mb-2"><Users size={16} /> {partnerProgress.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="stat-label">Start</p>
                <p className="text-body font-bold">{partnerProgress.start_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="stat-label">Current</p>
                <p className="text-body font-bold text-accent-500">{partnerProgress.current_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="stat-label">Lost</p>
                <p className="text-body font-bold text-success">{partnerProgress.lost} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Couple leaderboard */}
        {leaderboard && leaderboard.partner_name && (
          <div className="card">
            <h3 className="section-title mb-3"><Trophy size={16} /> Couple Leaderboard</h3>
            <div className="space-y-2">
              {[
                { name: user?.name || 'Me', score: leaderboard.my_score },
                { name: leaderboard.partner_name, score: leaderboard.partner_score },
              ]
                .sort((a, b) => b.score - a.score)
                .map((entry, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-btn ${i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-surface-50 dark:bg-surface-700'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold
                      ${i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'bg-surface-200 dark:bg-surface-600 text-surface-500'}`}>
                      {i + 1}
                    </div>
                    <span className="flex-1 text-body font-medium">{entry.name}</span>
                    <span className="text-body font-bold text-primary-500">{entry.score} pts</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="card">
          <h3 className="section-title mb-3"><Award size={16} /> Badges</h3>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(badge => (
              <div key={badge.id}
                className={`text-center p-3 rounded-btn relative ${badge.earned_at
                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800'
                  : 'bg-surface-50 dark:bg-surface-700 opacity-40'}`}>
                {!badge.earned_at && <Lock size={10} className="absolute top-1.5 right-1.5 text-surface-400" />}
                <div className="text-xl mb-1">{badge.emoji}</div>
                <p className="text-micro font-medium">{badge.name}</p>
                {badge.earned_at && <p className="text-micro text-success mt-0.5">Earned!</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

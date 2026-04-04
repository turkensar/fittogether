'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { DashboardSummary, Challenge, PairingStatus } from '@/types';

function ProgressRing({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState({ my_streak: 0, couple_streak: 0 });
  const [water, setWater] = useState({ my_water_ml: 0, partner_water_ml: 0 });
  const [cheatDays, setCheatDays] = useState({ my_cheat_days: 0, partner_cheat_days: 0, max_per_week: 2 });
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [dietBreakResult, setDietBreakResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.get<DashboardSummary>('/api/gamification/dashboard-summary').then(setSummary);
      api.get<Challenge[]>('/api/challenges/daily').then(setChallenges);
      api.get('/api/gamification/streak').then((d: any) => setStreak(d));
      api.get('/api/tracking/water/today').then((d: any) => setWater(d));
      api.get('/api/tracking/cheat-days/weekly').then((d: any) => setCheatDays(d));
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
    }
  }, [user, authLoading, router]);

  const completeChallenge = async (id: string) => {
    try {
      await api.post('/api/challenges/complete', { challenge_id: id });
      setChallenges(ch => ch.map(c => c.id === id ? { ...c, completed: true } : c));
    } catch {}
  };

  const addWater = async (ml: number) => {
    try {
      await api.post('/api/tracking/water', { amount_ml: ml });
      setWater(w => ({ ...w, my_water_ml: w.my_water_ml + ml }));
    } catch {}
  };

  const breakDiet = async () => {
    try {
      const res = await api.post<any>('/api/challenges/diet-break');
      setDietBreakResult(res.punishment);
      setTimeout(() => setDietBreakResult(null), 8000);
    } catch {}
  };

  if (authLoading || !summary) {
    return <AppShell><div className="flex justify-center pt-20"><div className="animate-spin text-4xl">💫</div></div></AppShell>;
  }

  const myPct = summary.my_goal > 0 ? (summary.my_calories / summary.my_goal) * 100 : 0;
  const partnerPct = summary.partner_goal > 0 ? (summary.partner_calories / summary.partner_goal) * 100 : 0;

  return (
    <AppShell>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hey {user?.name}! 👋</h1>
            <p className="text-sm text-gray-500">Let's make today count</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{user?.avatar_emoji}</span>
            {pairing?.paired && <span className="text-2xl">{pairing.partner?.avatar_emoji}</span>}
          </div>
        </div>

        {/* Partner status */}
        {!pairing?.paired && (
          <div className="card bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 p-4">
            <p className="text-sm font-medium">No partner yet!</p>
            <button onClick={() => router.push('/pairing')} className="text-primary-500 text-sm font-medium mt-1">
              Find your partner →
            </button>
          </div>
        )}

        {/* Calorie cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card flex flex-col items-center py-5">
            <div className="relative mb-2">
              <ProgressRing percent={myPct} color="#6C63FF" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{Math.round(myPct)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">My Calories</p>
            <p className="font-bold">{summary.my_calories} <span className="text-xs text-gray-400">/ {summary.my_goal}</span></p>
            <p className="text-xs text-primary-500">{summary.my_remaining} remaining</p>
          </div>

          {pairing?.paired && (
            <div className="card flex flex-col items-center py-5">
              <div className="relative mb-2">
                <ProgressRing percent={partnerPct} color="#FF6B8A" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{Math.round(partnerPct)}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{summary.partner_name}</p>
              <p className="font-bold">{summary.partner_calories} <span className="text-xs text-gray-400">/ {summary.partner_goal}</span></p>
              <p className="text-xs text-accent-500">{summary.partner_remaining} remaining</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <div className="text-2xl mb-1">🔥</div>
            <p className="text-lg font-bold">{streak.couple_streak}</p>
            <p className="text-[10px] text-gray-500">Couple Streak</p>
          </div>
          <div className="card text-center py-3">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-lg font-bold">{summary.couple_score}</p>
            <p className="text-[10px] text-gray-500">Couple Score</p>
          </div>
          <div className="card text-center py-3">
            <div className="text-2xl mb-1">😈</div>
            <p className="text-lg font-bold">{cheatDays.my_cheat_days}/{cheatDays.max_per_week}</p>
            <p className="text-[10px] text-gray-500">Cheat Days</p>
          </div>
        </div>

        {/* Water tracking */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">💧 Water Today</h3>
            <span className="text-sm text-gray-500">{(water.my_water_ml / 1000).toFixed(1)}L / 2L</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-3">
            <div className="bg-blue-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (water.my_water_ml / 2000) * 100)}%` }} />
          </div>
          <div className="flex gap-2">
            {[250, 500, 750].map(ml => (
              <button key={ml} onClick={() => addWater(ml)} className="btn-secondary text-xs flex-1 py-2">
                +{ml}ml
              </button>
            ))}
          </div>
          {pairing?.paired && (
            <p className="text-xs text-gray-400 mt-2">Partner: {(water.partner_water_ml / 1000).toFixed(1)}L</p>
          )}
        </div>

        {/* Daily challenges */}
        <div className="card">
          <h3 className="font-semibold mb-3">🎯 Today's Challenges</h3>
          {challenges.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <span className="text-xl">{ch.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${ch.completed ? 'line-through text-gray-400' : ''}`}>{ch.title}</p>
                <p className="text-xs text-gray-400">{ch.description}</p>
              </div>
              {ch.completed ? (
                <span className="text-green-500 text-sm">✓</span>
              ) : (
                <button onClick={() => completeChallenge(ch.id)} className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-500 px-3 py-1 rounded-lg">
                  Done
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Diet break button */}
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">😅 I Broke the Diet</h3>
              <p className="text-xs text-gray-500">Honest is good! Press if you slipped</p>
            </div>
            <button onClick={breakDiet} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95">
              Confess
            </button>
          </div>
          {dietBreakResult && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm font-medium">Your fun punishment:</p>
              <p className="text-sm text-accent-500 mt-1">{dietBreakResult}</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/meals')} className="btn-primary text-sm py-4">
            🍽️ Log Meal
          </button>
          <button onClick={() => router.push('/chat')} className="btn-accent text-sm py-4">
            💬 Chat
          </button>
        </div>
      </div>
    </AppShell>
  );
}

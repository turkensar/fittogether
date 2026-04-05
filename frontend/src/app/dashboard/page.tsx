'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { DashboardSummary, Challenge, PairingStatus } from '@/types';
import {
  Flame, Trophy, CalendarOff, Droplets, Target, ChevronDown, ChevronUp,
  AlertTriangle, Plus, Users, Loader2,
} from 'lucide-react';

function ProgressRing({ percent, color, size = 100, strokeWidth = 8 }: { percent: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-surface-100 dark:text-surface-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-micro text-surface-400 w-8">{label}</span>
      <div className="flex-1 bg-surface-100 dark:bg-surface-700 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-micro text-surface-500 w-8 text-right">{value}g</span>
    </div>
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
  const [challengesOpen, setChallengesOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
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
    return <AppShell><div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div></AppShell>;
  }

  const myPct = summary.my_goal > 0 ? (summary.my_calories / summary.my_goal) * 100 : 0;
  const partnerPct = summary.partner_goal > 0 ? (summary.partner_calories / summary.partner_goal) * 100 : 0;
  const waterPct = Math.min(100, (water.my_water_ml / 2000) * 100);

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading">Hey {user?.name}!</h1>
            <p className="text-caption text-surface-400">Let's make today count</p>
          </div>
          {pairing?.paired && (
            <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-badge">
              <Users size={14} className="text-primary-500" />
              <span className="text-micro text-primary-600 dark:text-primary-300">{pairing.partner?.name}</span>
            </div>
          )}
        </div>

        {/* Partner CTA */}
        {!pairing?.paired && (
          <button onClick={() => router.push('/pairing')}
            className="w-full card flex items-center gap-3 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/10 dark:to-accent-900/10 border-primary-100 dark:border-primary-800">
            <Users size={18} className="text-primary-500" />
            <span className="text-body font-medium text-primary-600 dark:text-primary-300">Find your partner to get started</span>
          </button>
        )}

        {/* Main calorie tracker */}
        <div className="card">
          <div className="flex items-center gap-5">
            {/* My progress ring */}
            <div className="relative flex-shrink-0">
              <ProgressRing percent={myPct} color="#7c5cfc" size={110} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{summary.my_calories}</span>
                <span className="text-micro text-surface-400">/ {summary.my_goal}</span>
              </div>
            </div>

            {/* Right side info */}
            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-caption text-surface-400">Remaining</p>
                <p className="text-lg font-bold text-primary-500">{summary.my_remaining} cal</p>
              </div>
              <div className="space-y-1.5">
                <MacroBar label="P" value={0} max={100} color="#7c5cfc" />
                <MacroBar label="C" value={0} max={100} color="#f59e0b" />
                <MacroBar label="F" value={0} max={100} color="#ec4899" />
              </div>
            </div>
          </div>

          {/* Partner mini bar */}
          {pairing?.paired && (
            <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <ProgressRing percent={partnerPct} color="#ec4899" size={36} strokeWidth={4} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-bold">{Math.round(partnerPct)}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-caption font-medium">{summary.partner_name}</p>
                <p className="text-micro text-surface-400">{summary.partner_calories} / {summary.partner_goal} cal</p>
              </div>
              <p className="text-caption text-accent-500 font-semibold">{summary.partner_remaining} left</p>
            </div>
          )}
        </div>

        {/* Water tracker - compact */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-info" />
              <span className="text-subheading">Water</span>
            </div>
            <span className="text-caption text-surface-400">{(water.my_water_ml / 1000).toFixed(1)}L / 2L</span>
          </div>
          <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 mb-2.5">
            <div className="bg-info h-2 rounded-full transition-all duration-500" style={{ width: `${waterPct}%` }} />
          </div>
          <div className="flex gap-2">
            {[250, 500, 750].map(ml => (
              <button key={ml} onClick={() => addWater(ml)} className="btn-secondary text-caption flex-1 py-1.5 px-2">
                <Plus size={12} className="inline mr-0.5" />{ml}ml
              </button>
            ))}
          </div>
          {pairing?.paired && (
            <p className="text-micro text-surface-400 mt-2">Partner: {(water.partner_water_ml / 1000).toFixed(1)}L</p>
          )}
        </div>

        {/* Stats row - compact */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-2.5 px-2">
            <Flame size={16} className="mx-auto mb-1 text-orange-500" />
            <p className="stat-value text-base">{streak.couple_streak}</p>
            <p className="stat-label">Streak</p>
          </div>
          <div className="card text-center py-2.5 px-2">
            <Trophy size={16} className="mx-auto mb-1 text-yellow-500" />
            <p className="stat-value text-base">{summary.couple_score}</p>
            <p className="stat-label">Score</p>
          </div>
          <div className="card text-center py-2.5 px-2">
            <CalendarOff size={16} className="mx-auto mb-1 text-surface-400" />
            <p className="stat-value text-base">{cheatDays.my_cheat_days}/{cheatDays.max_per_week}</p>
            <p className="stat-label">Cheat</p>
          </div>
        </div>

        {/* Challenges - collapsible */}
        <div className="card">
          <button onClick={() => setChallengesOpen(o => !o)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary-500" />
              <span className="text-subheading">Today's Challenges</span>
              <span className="text-micro bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-1.5 py-0.5 rounded-badge">
                {challenges.filter(c => c.completed).length}/{challenges.length}
              </span>
            </div>
            {challengesOpen ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
          </button>
          {challengesOpen && (
            <div className="mt-3 space-y-2">
              {challenges.map(ch => (
                <div key={ch.id} className={`flex items-center gap-3 p-2.5 rounded-btn ${ch.completed ? 'bg-success/5' : 'bg-surface-50 dark:bg-surface-700'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                    ${ch.completed ? 'bg-success/10 text-success' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'}`}>
                    {ch.completed ? '✓' : ch.points}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-body font-medium truncate ${ch.completed ? 'line-through text-surface-400' : ''}`}>{ch.title}</p>
                    <p className="text-micro text-surface-400 truncate">{ch.description}</p>
                  </div>
                  {!ch.completed && (
                    <button onClick={() => completeChallenge(ch.id)} className="btn-primary py-1 px-3 text-caption">
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diet break - soft & small */}
        <div className="card bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              <div>
                <p className="text-body font-medium text-orange-700 dark:text-orange-300">Slipped up?</p>
                <p className="text-micro text-surface-400">It's okay, be honest</p>
              </div>
            </div>
            <button onClick={breakDiet} className="bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-300 px-3 py-1.5 rounded-btn text-caption font-semibold transition-all active:scale-[0.97]">
              Confess
            </button>
          </div>
          {dietBreakResult && (
            <div className="mt-2.5 p-2.5 bg-white dark:bg-surface-800 rounded-btn">
              <p className="text-caption font-medium text-surface-500">Your fun challenge:</p>
              <p className="text-body text-accent-600 dark:text-accent-400 mt-0.5">{dietBreakResult}</p>
            </div>
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => router.push('/meals')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-fab flex items-center justify-center transition-all active:scale-90 z-40"
        >
          <Plus size={24} />
        </button>
      </div>
    </AppShell>
  );
}

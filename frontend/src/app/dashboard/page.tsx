'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import Spinner from '@/components/ui/Spinner';
import PageError from '@/components/ui/PageError';
import { DashboardSummary, Challenge, PairingStatus, Notification } from '@/types';
import {
  Flame, Trophy, CalendarOff, Droplets, Target, ChevronDown, ChevronUp,
  AlertTriangle, Plus, Users, Bell, X, TrendingDown, TrendingUp,
  Zap, UtensilsCrossed, BarChart3,
} from 'lucide-react';

interface Reminder {
  type: string;
  icon: string;
  title: string;
  message: string;
  priority: string;
}

interface WeeklyReport {
  week_start: string;
  week_end: string;
  total_calories: number;
  avg_calories: number;
  total_water_ml: number;
  avg_water_ml: number;
  weight_change: number;
  challenges_completed: number;
  points_earned: number;
  active_days: number;
  calorie_goal: number;
}

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

function HeatmapGrid({ heatmap }: { heatmap: { active_dates: string[]; start: string; end: string; longest_streak: number } }) {
  const startDate = new Date(heatmap.start);
  const endDate = new Date(heatmap.end);
  const activeSet = new Set(heatmap.active_dates);
  const days: { date: string; active: boolean }[] = [];
  const cursor = new Date(startDate);
  while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() - 1);
  const limit = 200;
  let count = 0;
  while ((cursor <= endDate || days.length % 7 !== 0) && count < limit) {
    const ds = cursor.toISOString().split('T')[0];
    days.push({ date: ds, active: activeSet.has(ds) });
    cursor.setDate(cursor.getDate() + 1);
    count++;
  }
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <div className="flex gap-0.5 mb-1 pl-5">
        {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(label => (
          <span key={label} className="w-3 text-[8px] text-surface-400 text-center">{label[0]}</span>
        ))}
      </div>
      <div className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(day => {
              const inRange = day.date >= heatmap.start && day.date <= heatmap.end;
              return (
                <div key={day.date} title={day.date}
                  className={`w-3 h-3 rounded-[2px] ${
                    !inRange ? 'bg-transparent' :
                    day.active ? 'bg-primary-500' : 'bg-surface-100 dark:bg-surface-700'
                  }`} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-surface-400">Az</span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-surface-100 dark:bg-surface-700" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary-300" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary-500" />
        <span className="text-[9px] text-surface-400">Çok</span>
      </div>
    </div>
  );
}

const REMINDER_ICONS: Record<string, typeof Droplets> = {
  droplets: Droplets, utensils: UtensilsCrossed, target: Target, flame: Flame,
};

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [heatmap, setHeatmap] = useState<{ active_dates: string[]; start: string; end: string; longest_streak: number } | null>(null);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setError(null);
    api.get<DashboardSummary>('/api/gamification/dashboard-summary').then(setSummary).catch(() => setError('Dashboard verileri yüklenemedi.'));
    api.get<Challenge[]>('/api/challenges/daily').then(setChallenges).catch(() => {});
    api.get('/api/gamification/streak').then((d: any) => setStreak(d)).catch(() => {});
    api.get('/api/tracking/water/today').then((d: any) => setWater(d)).catch(() => {});
    api.get('/api/tracking/cheat-days/weekly').then((d: any) => setCheatDays(d)).catch(() => {});
    api.get<PairingStatus>('/api/pairing/status').then(setPairing).catch(() => {});
    api.get<Reminder[]>('/api/social/reminders').then(setReminders).catch(() => {});
    api.get<WeeklyReport>('/api/gamification/weekly-report').then(setWeeklyReport).catch(() => {});
    api.get<Notification[]>('/api/social/notifications').then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadData();
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

  const dismissReminder = (type: string) => {
    setDismissedReminders(prev => new Set(prev).add(type));
  };

  if (error) {
    return <PageError message={error} onRetry={loadData} />;
  }

  if (authLoading || !summary) {
    return <AppShell><Spinner label="Yükleniyor..." /></AppShell>;
  }

  const myPct = summary.my_goal > 0 ? (summary.my_calories / summary.my_goal) * 100 : 0;
  const partnerPct = summary.partner_goal > 0 ? (summary.partner_calories / summary.partner_goal) * 100 : 0;
  const GLASS_ML = 250;
  const GLASSES_GOAL = 8;
  const waterGoal = GLASS_ML * GLASSES_GOAL;
  const myGlasses = Math.floor(water.my_water_ml / GLASS_ML);
  const partnerGlasses = Math.floor(water.partner_water_ml / GLASS_ML);
  const waterPct = Math.min(100, (water.my_water_ml / waterGoal) * 100);
  const waterOver = water.my_water_ml > waterGoal;
  const extraGlasses = Math.max(0, myGlasses - GLASSES_GOAL);
  const activeReminders = reminders.filter(r => !dismissedReminders.has(r.type));
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading">Merhaba {user?.name}!</h1>
            <p className="text-caption text-surface-400">Bugünü verimli geçirelim</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/settings')}
              className="relative w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              <Bell size={16} className="text-surface-500 dark:text-surface-300" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-danger text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            {weeklyReport && (
              <button onClick={() => setShowReport(true)}
                className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <BarChart3 size={16} className="text-primary-500" />
              </button>
            )}
            {pairing?.paired && (
              <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-badge">
                <Users size={14} className="text-primary-500" />
                <span className="text-micro text-primary-600 dark:text-primary-300">{pairing.partner?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reminders / Notifications — compact stack */}
        {activeReminders.length > 0 && (
          <div className="space-y-1.5">
            {(notifExpanded ? activeReminders : activeReminders.slice(0, 1)).map(r => {
              const RIcon = REMINDER_ICONS[r.icon] || Bell;
              const colors = r.priority === 'high'
                ? 'bg-danger/5 border-danger/10 text-danger'
                : r.priority === 'medium'
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300';
              return (
                <div key={r.type} className={`flex items-start gap-2.5 p-3 rounded-btn border ${colors}`}>
                  <RIcon size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-semibold">{r.title}</p>
                    <p className="text-micro opacity-80">{r.message}</p>
                  </div>
                  <button onClick={() => dismissReminder(r.type)} className="flex-shrink-0 opacity-50 hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            {activeReminders.length > 1 && !notifExpanded && (
              <button onClick={() => setNotifExpanded(true)}
                className="w-full text-center text-micro text-surface-400 hover:text-surface-600 py-1 bg-surface-50 dark:bg-surface-700 rounded-btn">
                +{activeReminders.length - 1} bildirim daha
              </button>
            )}
            {activeReminders.length > 1 && notifExpanded && (
              <button onClick={() => setNotifExpanded(false)}
                className="w-full text-center text-micro text-surface-400 hover:text-surface-600 py-1 bg-surface-50 dark:bg-surface-700 rounded-btn">
                Daralt
              </button>
            )}
          </div>
        )}

        {/* Partner CTA */}
        {!pairing?.paired && (
          <button onClick={() => router.push('/pairing')}
            className="w-full card flex items-center gap-3 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/10 dark:to-accent-900/10 border-primary-100 dark:border-primary-800">
            <Users size={18} className="text-primary-500" />
            <span className="text-body font-medium text-primary-600 dark:text-primary-300">Partnerini bul, birlikte başlayın</span>
          </button>
        )}

        {/* Main calorie tracker */}
        <div className="card">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <ProgressRing percent={myPct} color="#7c5cfc" size={110} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{summary.my_calories}</span>
                <span className="text-micro text-surface-400">/ {summary.my_goal}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-caption text-surface-400">Kalan</p>
                <p className="text-lg font-bold text-primary-500">{summary.my_remaining} kcal</p>
              </div>
              <div className="space-y-1.5">
                <MacroBar label="P" value={Math.round(summary.my_protein || 0)} max={150} color="#3b82f6" />
                <MacroBar label="K" value={Math.round(summary.my_carbs || 0)} max={250} color="#f59e0b" />
                <MacroBar label="Y" value={Math.round(summary.my_fat || 0)} max={80} color="#eab308" />
                {summary.my_calories > 0 && (summary.my_protein || 0) + (summary.my_carbs || 0) + (summary.my_fat || 0) === 0 && (
                  <p className="text-micro text-surface-400 italic">Makro bilgisi için yemekleri popüler listeden seçin</p>
                )}
              </div>
            </div>
          </div>

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
                <p className="text-micro text-surface-400">{summary.partner_calories} / {summary.partner_goal} kcal</p>
              </div>
              <p className="text-caption text-accent-500 font-semibold">{summary.partner_remaining} kaldı</p>
            </div>
          )}
        </div>

        {/* Water tracker */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets size={16} className={waterOver ? 'text-green-500' : 'text-info'} />
              <span className="text-subheading">Su</span>
            </div>
            <span className="text-caption text-surface-400">{myGlasses} / {GLASSES_GOAL} bardak</span>
          </div>

          {/* Glass grid */}
          <div className="flex gap-1 mb-2">
            {Array.from({ length: GLASSES_GOAL }).map((_, i) => {
              const filled = i < myGlasses;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (filled) return;
                    addWater(GLASS_ML);
                  }}
                  className={`flex-1 aspect-[3/4] rounded-md flex items-end justify-center transition-all active:scale-95 ${
                    filled
                      ? 'bg-gradient-to-t from-info to-sky-300 shadow-inner'
                      : 'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600'
                  }`}
                  title={filled ? `${(i + 1) * GLASS_ML}ml` : 'Bardak ekle'}
                >
                  {filled
                    ? <Droplets size={12} className="text-white mb-1" />
                    : <Plus size={10} className="text-surface-400 mb-1" />}
                </button>
              );
            })}
          </div>

          <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 mb-1">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${waterOver ? 'bg-green-500' : 'bg-info'}`} style={{ width: `${waterPct}%` }} />
          </div>
          {waterOver && (
            <p className="text-micro text-green-600 dark:text-green-400 font-semibold mb-1.5">
              +{extraGlasses} bardak fazla — harika gidiyorsun!
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <button onClick={() => addWater(GLASS_ML)} className="btn-secondary text-caption flex-1 py-1.5 px-2">
              <Plus size={12} className="inline mr-0.5" />1 Bardak
            </button>
            <button onClick={() => addWater(GLASS_ML * 2)} className="btn-secondary text-caption flex-1 py-1.5 px-2">
              <Plus size={12} className="inline mr-0.5" />2 Bardak
            </button>
          </div>

          {pairing?.paired && (
            <div className="mt-2 flex items-center gap-2">
              <Droplets size={12} className="text-accent-500" />
              <p className="text-caption text-surface-600 dark:text-surface-300">
                {pairing.partner?.name}: <span className="font-semibold text-accent-500">{partnerGlasses} bardak</span>
              </p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => {
            setShowStreak(true);
            if (!heatmap) api.get<typeof heatmap>('/api/gamification/streak-heatmap?days=90').then(setHeatmap).catch(() => {});
          }} className="card text-center py-2.5 px-2 active:scale-95 transition-transform">
            <Flame size={16} className="mx-auto mb-1 text-orange-500" />
            <p className="stat-value text-base">{streak.couple_streak}</p>
            <p className="stat-label">Seri</p>
          </button>
          <div className="card text-center py-2.5 px-2">
            <Trophy size={16} className="mx-auto mb-1 text-yellow-500" />
            <p className="stat-value text-base">{summary.couple_score}</p>
            <p className="stat-label">Puan</p>
          </div>
          <div className="card text-center py-2.5 px-2">
            <CalendarOff size={16} className="mx-auto mb-1 text-surface-400" />
            <p className="stat-value text-base">{cheatDays.my_cheat_days}/{cheatDays.max_per_week}</p>
            <p className="stat-label">Mola</p>
          </div>
        </div>

        {/* Challenges */}
        <div className="card">
          <button onClick={() => setChallengesOpen(o => !o)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary-500" />
              <span className="text-subheading">Günün Meydan Okumaları</span>
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
                      Tamam
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diet break */}
        <div className="card bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              <div>
                <p className="text-body font-medium text-orange-700 dark:text-orange-300">Ufak bir kayma mı?</p>
                <p className="text-micro text-surface-400">Sorun değil, dürüst ol</p>
              </div>
            </div>
            <button onClick={breakDiet} className="bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-300 px-3 py-1.5 rounded-btn text-caption font-semibold transition-all active:scale-[0.97]">
              İtiraf Et
            </button>
          </div>
          {dietBreakResult && (
            <div className="mt-2.5 p-2.5 bg-white dark:bg-surface-800 rounded-btn">
              <p className="text-caption font-medium text-surface-500">Eğlenceli cezan:</p>
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

        {/* Weekly Report Modal */}
        {showReport && weeklyReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowReport(false)}>
            <div className="bg-white dark:bg-surface-800 rounded-card w-full max-w-sm p-5 shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-500" /> Haftalık Rapor
                </h2>
                <button onClick={() => setShowReport(false)} className="text-surface-400 hover:text-surface-600">
                  <X size={18} />
                </button>
              </div>

              <p className="text-micro text-surface-400 mb-4">
                {new Date(weeklyReport.week_start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                {' - '}
                {new Date(weeklyReport.week_end).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>

              <div className="space-y-3">
                {/* Calorie summary */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-btn p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={14} className="text-primary-500" />
                    <span className="text-caption font-semibold">Kalori</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-micro text-surface-400">Toplam</p>
                      <p className="text-body font-bold">{weeklyReport.total_calories.toLocaleString()} kcal</p>
                    </div>
                    <div>
                      <p className="text-micro text-surface-400">Günlük Ort.</p>
                      <p className="text-body font-bold">{weeklyReport.avg_calories} kcal</p>
                    </div>
                  </div>
                  {weeklyReport.avg_calories > 0 && (
                    <p className={`text-micro mt-1 font-semibold ${weeklyReport.avg_calories <= weeklyReport.calorie_goal ? 'text-success' : 'text-danger'}`}>
                      {weeklyReport.avg_calories <= weeklyReport.calorie_goal
                        ? `Hedefin altında kaldin!`
                        : `Hedefin ${weeklyReport.avg_calories - weeklyReport.calorie_goal} kcal üstünde`}
                    </p>
                  )}
                </div>

                {/* Water summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-btn p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets size={14} className="text-blue-500" />
                    <span className="text-caption font-semibold">Su Tüketimi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-micro text-surface-400">Toplam</p>
                      <p className="text-body font-bold">{(weeklyReport.total_water_ml / 1000).toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-micro text-surface-400">Günlük Ort.</p>
                      <p className="text-body font-bold">{(weeklyReport.avg_water_ml / 1000).toFixed(1)}L</p>
                    </div>
                  </div>
                </div>

                {/* Weight change */}
                <div className={`rounded-btn p-3 ${weeklyReport.weight_change <= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {weeklyReport.weight_change <= 0
                      ? <TrendingDown size={14} className="text-green-500" />
                      : <TrendingUp size={14} className="text-red-500" />}
                    <span className="text-caption font-semibold">Kilo Değişimi</span>
                  </div>
                  <p className="text-body font-bold">
                    {weeklyReport.weight_change > 0 ? '+' : ''}{weeklyReport.weight_change} kg
                  </p>
                  <p className="text-micro text-surface-400">
                    {weeklyReport.weight_change < 0 ? 'Harika gidiyorsun!' : weeklyReport.weight_change === 0 ? 'Stabil kaldın' : 'Dikkatli olalım'}
                  </p>
                </div>

                {/* Activity summary */}
                <div className="bg-surface-50 dark:bg-surface-700 rounded-btn p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-caption font-semibold">Aktivite</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-body font-bold text-primary-500">{weeklyReport.active_days}/7</p>
                      <p className="text-micro text-surface-400">Aktif Gün</p>
                    </div>
                    <div>
                      <p className="text-body font-bold text-yellow-500">{weeklyReport.challenges_completed}</p>
                      <p className="text-micro text-surface-400">Challenge</p>
                    </div>
                    <div>
                      <p className="text-body font-bold text-accent-500">{weeklyReport.points_earned}</p>
                      <p className="text-micro text-surface-400">Puan</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowReport(false)} className="btn-primary w-full mt-4">Tamam</button>
            </div>
          </div>
        )}

        {/* Streak Heatmap Modal */}
        {showStreak && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowStreak(false)}>
            <div className="bg-white dark:bg-surface-800 rounded-card w-full max-w-sm p-5 shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" /> Seri Haritası
                </h2>
                <button onClick={() => setShowStreak(false)} className="text-surface-400 hover:text-surface-600">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-btn p-3 text-center">
                  <p className="text-lg font-bold text-orange-500">{streak.my_streak}</p>
                  <p className="text-micro text-surface-400">Mevcut Seri</p>
                </div>
                <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-btn p-3 text-center">
                  <p className="text-lg font-bold text-primary-500">{heatmap?.longest_streak || 0}</p>
                  <p className="text-micro text-surface-400">En Uzun Seri</p>
                </div>
              </div>

              {heatmap && <HeatmapGrid heatmap={heatmap} />}

              <button onClick={() => setShowStreak(false)} className="btn-primary w-full mt-4">Tamam</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

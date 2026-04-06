'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import Spinner from '@/components/ui/Spinner';
import PageError from '@/components/ui/PageError';
import { WeightProgress, Badge as BadgeType } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  TrendingUp, Scale, Trophy, Award, Users, Loader2, Lock, X, Droplets,
  Flame, Star, ChevronDown, ChevronUp,
} from 'lucide-react';

interface WeeklyCalorie { date: string; calories: number; }
interface WeeklyWater { date: string; amount_ml: number; }

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myProgress, setMyProgress] = useState<WeightProgress | null>(null);
  const [partnerProgress, setPartnerProgress] = useState<any>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [logging, setLogging] = useState(false);
  const [weeklyCalories, setWeeklyCalories] = useState<WeeklyCalorie[]>([]);
  const [weeklyWater, setWeeklyWater] = useState<WeeklyWater[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [confettiBadgeId, setConfettiBadgeId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    weight: true, calories: true, water: true, badges: true,
  });

  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setError(null);
    api.get<WeightProgress>('/api/tracking/weight/progress').then(setMyProgress).catch(() => setError('\u0130lerleme verileri y\u00FCklenemedi.'));
    api.get('/api/tracking/weight/partner-progress').then(setPartnerProgress).catch(() => {});
    api.get<BadgeType[]>('/api/gamification/badges').then(data => {
      setBadges(data);
      const now = Date.now();
      data.forEach(b => {
        if (b.earned_at) {
          const earned = new Date(b.earned_at).getTime();
          if (now - earned < 60000) setConfettiBadgeId(b.id);
        }
      });
    }).catch(() => {});
    api.get('/api/gamification/leaderboard').then(setLeaderboard).catch(() => {});
    api.get<WeeklyCalorie[]>('/api/meals/weekly-calories').then(setWeeklyCalories).catch(() => {});
    api.get<WeeklyWater[]>('/api/tracking/water/weekly').then(setWeeklyWater).catch(() => {});
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadData();
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

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Pz', 'Pt', 'Sa', '\u00C7a', 'Pe', 'Cu', 'Ct'];
    return days[d.getDay()];
  };

  if (error) {
    return <PageError message={error} onRetry={loadData} />;
  }

  if (authLoading || !myProgress) {
    return <AppShell><Spinner label="Y\u00FCkleniyor..." /></AppShell>;
  }

  const chartData = myProgress.logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    weight: l.weight,
  }));

  const calGoal = user?.daily_calorie_goal || 2000;
  const avgCalories = weeklyCalories.length > 0
    ? Math.round(weeklyCalories.reduce((s, d) => s + d.calories, 0) / weeklyCalories.filter(d => d.calories > 0).length || 0)
    : 0;

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" />
          <h1 className="text-heading">\u0130lerleme</h1>
        </div>

        {/* Weight summary */}
        <div className="card">
          <button onClick={() => toggleSection('weight')} className="w-full flex items-center justify-between mb-3">
            <h3 className="section-title"><Scale size={16} /> Kilo Yolculu\u011Fum</h3>
            <div className="flex items-center gap-2">
              <span className="text-caption text-primary-500 font-bold">%{myProgress.percentage}</span>
              {expandedSections.weight ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
            </div>
          </button>

          {expandedSections.weight && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <p className="stat-label">Ba\u015Flang\u0131\u00E7</p>
                  <p className="text-body font-bold">{myProgress.start_weight} kg</p>
                </div>
                <div className="text-center">
                  <p className="stat-label">\u015Eimdiki</p>
                  <p className="text-body font-bold text-primary-500">{myProgress.current_weight} kg</p>
                </div>
                <div className="text-center">
                  <p className="stat-label">Hedef</p>
                  <p className="text-body font-bold text-success">{myProgress.target_weight} kg</p>
                </div>
              </div>

              <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-3 mb-1.5">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-1"
                  style={{ width: `${Math.min(100, myProgress.percentage)}%` }}>
                  {myProgress.percentage > 15 && <span className="text-[8px] text-white font-bold">{myProgress.lost}kg</span>}
                </div>
              </div>
              <p className="text-micro text-surface-400 text-center">\u015Eu ana kadar {myProgress.lost} kg verildi!</p>
            </>
          )}
        </div>

        {/* Weight chart */}
        {chartData.length > 1 && expandedSections.weight && (
          <div className="card">
            <h3 className="section-title mb-3">Kilo De\u011Fi\u015Fim Grafi\u011Fi</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value} kg`, 'Kilo']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#7c5cfc" strokeWidth={2.5}
                    dot={{ fill: '#7c5cfc', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#7c5cfc', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly calorie chart */}
        {weeklyCalories.length > 0 && (
          <div className="card">
            <button onClick={() => toggleSection('calories')} className="w-full flex items-center justify-between mb-3">
              <h3 className="section-title"><Flame size={16} /> Haftal\u0131k Kalori</h3>
              <div className="flex items-center gap-2">
                <span className="text-micro text-surface-400">Ort: {avgCalories} kcal</span>
                {expandedSections.calories ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
              </div>
            </button>
            {expandedSections.calories && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyCalories.map(d => ({
                    day: formatDay(d.date),
                    calories: d.calories,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} kcal`, 'Kalori']}
                    />
                    <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {weeklyCalories.map((d, i) => (
                        <Cell key={i} fill={d.calories > calGoal ? '#ef4444' : d.calories > 0 ? '#7c5cfc' : '#e4e4e7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {expandedSections.calories && (
              <div className="flex items-center justify-center gap-4 mt-2 text-micro text-surface-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary-500 inline-block" /> Hedef alt\u0131
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-danger inline-block" /> Hedef \u00FCst\u00FC
                </span>
              </div>
            )}
          </div>
        )}

        {/* Weekly water history */}
        {weeklyWater.length > 0 && (
          <div className="card">
            <button onClick={() => toggleSection('water')} className="w-full flex items-center justify-between mb-3">
              <h3 className="section-title"><Droplets size={16} /> Haftal\u0131k Su T\u00FCketimi</h3>
              {expandedSections.water ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
            </button>
            {expandedSections.water && (
              <div className="space-y-1.5">
                {weeklyWater.map((d, i) => {
                  const pct = Math.min(100, (d.amount_ml / 2000) * 100);
                  const isToday = i === weeklyWater.length - 1;
                  return (
                    <div key={d.date} className="flex items-center gap-2">
                      <span className={`text-micro w-6 text-right ${isToday ? 'font-bold text-primary-500' : 'text-surface-400'}`}>
                        {formatDay(d.date)}
                      </span>
                      <div className="flex-1 bg-surface-100 dark:bg-surface-700 rounded-full h-4 relative overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-gradient-to-r from-sky-400 to-blue-500' : 'bg-sky-300 dark:bg-sky-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                        {d.amount_ml > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-sm">
                            {d.amount_ml >= 1000 ? `${(d.amount_ml / 1000).toFixed(1)}L` : `${d.amount_ml}ml`}
                          </span>
                        )}
                      </div>
                      {pct >= 100 && <Droplets size={12} className="text-blue-500 flex-shrink-0" />}
                    </div>
                  );
                })}
                <p className="text-micro text-surface-400 text-center mt-1">G\u00FCnl\u00FCk hedef: 2L</p>
              </div>
            )}
          </div>
        )}

        {/* Log weight */}
        <div className="card">
          <h3 className="section-title mb-3"><Scale size={16} /> Kilo Kaydet</h3>
          <form onSubmit={logWeight} className="flex gap-2">
            <input type="number" step="0.1" className="input-field flex-1" placeholder="Kilo (kg)"
              value={weight} onChange={e => setWeight(e.target.value)} required />
            <button type="submit" className="btn-primary px-6" disabled={logging}>
              {logging ? <Loader2 size={16} className="animate-spin" /> : 'Kaydet'}
            </button>
          </form>
        </div>

        {/* Partner progress */}
        {partnerProgress && (
          <div className="card bg-accent-50/50 dark:bg-accent-900/10 border-accent-100 dark:border-accent-900/30">
            <h3 className="section-title mb-2"><Users size={16} /> {partnerProgress.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="stat-label">Ba\u015Flang\u0131\u00E7</p>
                <p className="text-body font-bold">{partnerProgress.start_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="stat-label">\u015Eimdiki</p>
                <p className="text-body font-bold text-accent-500">{partnerProgress.current_weight} kg</p>
              </div>
              <div className="text-center">
                <p className="stat-label">Verilen</p>
                <p className="text-body font-bold text-success">{partnerProgress.lost} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Couple leaderboard */}
        {leaderboard && leaderboard.partner_name && (
          <div className="card">
            <h3 className="section-title mb-3"><Trophy size={16} /> \u00C7ift S\u0131ralamas\u0131</h3>
            <div className="space-y-2">
              {[
                { name: user?.name || 'Ben', score: leaderboard.my_score },
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
                    <span className="text-body font-bold text-primary-500">{entry.score} puan</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="card">
          <button onClick={() => toggleSection('badges')} className="w-full flex items-center justify-between mb-3">
            <h3 className="section-title"><Award size={16} /> Rozetler</h3>
            <div className="flex items-center gap-2">
              <span className="text-micro text-surface-400">
                {badges.filter(b => b.earned_at).length}/{badges.length}
              </span>
              {expandedSections.badges ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
            </div>
          </button>
          {expandedSections.badges && (
            <div className="grid grid-cols-3 gap-2">
              {badges.map(badge => {
                const earned = !!badge.earned_at;
                const showConfetti = confettiBadgeId === badge.id;
                return (
                  <button key={badge.id} type="button"
                    onClick={() => setSelectedBadge(badge)}
                    className={`text-center p-3 rounded-btn relative transition-all active:scale-95
                      ${earned
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 shadow-sm'
                        : 'bg-surface-50 dark:bg-surface-700 border border-surface-100 dark:border-surface-600 grayscale opacity-50'}`}>
                    {!earned && <Lock size={10} className="absolute top-1.5 right-1.5 text-surface-400" />}
                    {/* Confetti effect */}
                    {showConfetti && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-btn">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <span key={i}
                            className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
                            style={{
                              left: `${10 + Math.random() * 80}%`,
                              top: `${Math.random() * 30}%`,
                              backgroundColor: ['#7c5cfc', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][i % 5],
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: `${0.8 + Math.random() * 0.6}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className={`text-xl mb-1 ${earned ? '' : 'filter blur-[1px]'}`}>{badge.emoji}</div>
                    <p className="text-micro font-medium leading-tight">{badge.name}</p>
                    {earned && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-micro text-success font-semibold">Kazan\u0131ld\u0131</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Badge detail modal */}
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedBadge(null)}>
            <div className="bg-white dark:bg-surface-800 rounded-card w-full max-w-xs p-6 text-center shadow-xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedBadge(null)} className="absolute top-3 right-3 text-surface-400">
                <X size={18} />
              </button>
              <div className={`text-4xl mb-3 ${!selectedBadge.earned_at ? 'grayscale opacity-50' : ''}`}>
                {selectedBadge.emoji}
              </div>
              <h3 className="text-body font-bold mb-1">{selectedBadge.name}</h3>
              <p className="text-caption text-surface-500 mb-4">{selectedBadge.description}</p>

              {selectedBadge.earned_at ? (
                <div className="bg-success/10 text-success rounded-btn px-4 py-2 text-caption font-semibold">
                  <Star size={12} className="inline mr-1 fill-current" />
                  {new Date(selectedBadge.earned_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde kazan\u0131ld\u0131
                </div>
              ) : (
                <div className="bg-surface-50 dark:bg-surface-700 rounded-btn px-4 py-2 text-caption text-surface-400">
                  <Lock size={12} className="inline mr-1" />
                  Hen\u00FCz kazan\u0131lmad\u0131
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

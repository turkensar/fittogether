'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Heart, Flame, Trophy,
  Target, Scale, Ruler, Users, UtensilsCrossed, Droplets, ChevronRight,
} from 'lucide-react';

const EMOJIS = ['\uD83D\uDE0A', '\uD83D\uDCAA', '\uD83D\uDD25', '\uD83C\uDF1F', '\uD83E\uDD8B', '\uD83C\uDF38', '\uD83C\uDFAF', '\uD83C\uDFCB\uFE0F', '\uD83E\uDDD8', '\u2764\uFE0F'];
const COLORS = ['#7c5cfc', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#8b5cf6'];

const INTRO_SLIDES = [
  {
    Icon: Heart,
    color: 'text-pink-500',
    bg: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    title: 'FitTogether\'a Ho\u015F Geldin!',
    desc: 'Partnerinle birlikte sa\u011Fl\u0131kl\u0131 ya\u015Fam yolculu\u011Funa ba\u015Fla. Birbirinizi motive edin, hedeflerinize birlikte ula\u015F\u0131n.',
  },
  {
    Icon: UtensilsCrossed,
    color: 'text-primary-500',
    bg: 'from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20',
    title: '\u00D6\u011F\u00FCnlerini Takip Et',
    desc: 'T\u00FCrk mutfa\u011F\u0131na \u00F6zel yemek veritaban\u0131 ile kalori ve makro de\u011Ferlerini kolayca kaydet. Protein, karbonhidrat, ya\u011F hepsini g\u00F6r.',
  },
  {
    Icon: Trophy,
    color: 'text-yellow-500',
    bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
    title: 'Rozetler ve Puanlar',
    desc: 'G\u00FCnl\u00FCk meydan okumalar\u0131 tamamla, rozetler kazan, partnerinle yar\u0131\u015F. Kim daha \u00E7ok puan toplayacak?',
  },
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-2: intro slides, 3: body stats, 4: goals, 5: avatar & finish
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    age: '', height: '', current_weight: '', target_weight: '',
    gender: '', daily_calorie_goal: '2000', avatar_emoji: '\uD83D\uDE0A', avatar_color: '#7c5cfc',
  });

  const totalSteps = 6;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const handleSubmit = async () => {
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
    } catch { alert('Profil kaydedilemedi'); }
    finally { setLoading(false); }
  };

  const canNext = () => {
    if (step <= 2) return true;
    if (step === 3) return form.height && form.current_weight;
    if (step === 4) return form.daily_calorie_goal;
    return true;
  };

  const next = () => {
    if (step === totalSteps - 1) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-900 dark:to-surface-800 p-4 flex flex-col">
      {/* Progress bar */}
      <div className="max-w-lg mx-auto w-full mb-6 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-micro text-surface-400">Ad\u0131m {step + 1} / {totalSteps}</span>
          <span className="text-micro text-primary-500 font-semibold">%{Math.round(progressPct)}</span>
        </div>
        <div className="w-full bg-white/50 dark:bg-surface-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        {/* ═══ Step 0-2: Intro slides ═══ */}
        {step <= 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            {(() => {
              const slide = INTRO_SLIDES[step];
              return (
                <>
                  <div className={`w-24 h-24 bg-gradient-to-br ${slide.bg} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
                    <slide.Icon size={40} className={slide.color} />
                  </div>
                  <h1 className="text-heading text-2xl mb-3">{slide.title}</h1>
                  <p className="text-body text-surface-500 leading-relaxed max-w-sm">{slide.desc}</p>

                  {/* Feature pills for slide 0 */}
                  {step === 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {[
                        { Icon: UtensilsCrossed, text: '\u00D6\u011F\u00FCn Takibi' },
                        { Icon: Droplets, text: 'Su Takibi' },
                        { Icon: Flame, text: 'Streak' },
                        { Icon: Trophy, text: 'Rozetler' },
                      ].map(f => (
                        <span key={f.text} className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-surface-700 text-caption px-3 py-1.5 rounded-full shadow-sm">
                          <f.Icon size={12} className="text-primary-500" /> {f.text}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ═══ Step 3: Body stats ═══ */}
        {step === 3 && (
          <div className="flex-1">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scale size={24} className="text-primary-500" />
              </div>
              <h1 className="text-heading">V\u00FCcut Bilgilerin</h1>
              <p className="text-caption text-surface-400 mt-1">Sana \u00F6zel hedefler belirleyelim</p>
            </div>

            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold mb-1">Ya\u015F</label>
                  <input type="number" className="input-field" placeholder="25"
                    value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">Cinsiyet</label>
                  <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Se\u00E7</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kad\u0131n</option>
                    <option value="other">Di\u011Fer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-caption font-semibold mb-1">
                  <Ruler size={14} className="text-surface-400" /> Boy (cm)
                </label>
                <input type="number" className="input-field" placeholder="170" step="0.1"
                  value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-caption font-semibold mb-1">
                    <Scale size={14} className="text-surface-400" /> Mevcut Kilo
                  </label>
                  <input type="number" className="input-field" placeholder="75" step="0.1"
                    value={form.current_weight} onChange={e => setForm(f => ({ ...f, current_weight: e.target.value }))} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-caption font-semibold mb-1">
                    <Target size={14} className="text-success" /> Hedef Kilo
                  </label>
                  <input type="number" className="input-field" placeholder="65" step="0.1"
                    value={form.target_weight} onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} />
                </div>
              </div>

              {form.current_weight && form.target_weight && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-btn p-3 text-center">
                  <p className="text-caption text-primary-600 dark:text-primary-300">
                    Hedef: <span className="font-bold">{Math.abs(parseFloat(form.current_weight) - parseFloat(form.target_weight)).toFixed(1)} kg</span>
                    {parseFloat(form.current_weight) > parseFloat(form.target_weight) ? ' vermek' : ' almak'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Step 4: Calorie goal ═══ */}
        {step === 4 && (
          <div className="flex-1">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Flame size={24} className="text-orange-500" />
              </div>
              <h1 className="text-heading">G\u00FCnl\u00FCk Hedefin</h1>
              <p className="text-caption text-surface-400 mt-1">Ka\u00E7 kalori hedefliyorsun?</p>
            </div>

            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-caption font-semibold mb-2">G\u00FCnl\u00FCk Kalori Hedefi (kcal)</label>
                <input type="number" className="input-field text-center text-lg font-bold"
                  value={form.daily_calorie_goal}
                  onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'H\u0131zl\u0131 Zay\u0131fla', val: '1500', desc: '1500 kcal' },
                  { label: 'Dengeli', val: '2000', desc: '2000 kcal' },
                  { label: 'Kas Yap', val: '2500', desc: '2500 kcal' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setForm(f => ({ ...f, daily_calorie_goal: opt.val }))}
                    className={`p-3 rounded-btn text-center transition-all
                      ${form.daily_calorie_goal === opt.val
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700'
                        : 'bg-surface-50 dark:bg-surface-700'}`}>
                    <p className="text-caption font-semibold">{opt.label}</p>
                    <p className="text-micro text-surface-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <p className="text-micro text-surface-400 text-center">
                Bu de\u011Feri daha sonra ayarlardan de\u011Fi\u015Ftirebilirsin
              </p>
            </div>
          </div>
        )}

        {/* ═══ Step 5: Avatar & finish ═══ */}
        {step === 5 && (
          <div className="flex-1">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-accent-500" />
              </div>
              <h1 className="text-heading">Avatarini Se\u00E7</h1>
              <p className="text-caption text-surface-400 mt-1">Seni yans\u0131tan bir avatar belirle</p>
            </div>

            <div className="card p-5 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg ring-4 ring-white dark:ring-surface-700"
                  style={{ backgroundColor: form.avatar_color + '22' }}>
                  {form.avatar_emoji}
                </div>

                <p className="text-caption font-semibold mb-2">Emoji</p>
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setForm(f => ({ ...f, avatar_emoji: e }))}
                      className={`text-2xl p-1.5 rounded-btn transition-all
                        ${form.avatar_emoji === e ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-300 scale-110' : 'hover:bg-surface-100 dark:hover:bg-surface-700'}`}>
                      {e}
                    </button>
                  ))}
                </div>

                <p className="text-caption font-semibold mb-2">Renk</p>
                <div className="flex gap-2.5 justify-center">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.avatar_color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="bg-success/10 rounded-btn p-3 text-center mt-2">
                <p className="text-caption text-success font-semibold">
                  Haz\u0131rs\u0131n! Profilini kaydedip partnerini davet edebilirsin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6 mb-4">
          {step > 0 && (
            <button onClick={back} className="btn-secondary flex items-center gap-1.5 px-5">
              <ArrowLeft size={16} /> Geri
            </button>
          )}
          <button onClick={next} disabled={!canNext() || loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : step === totalSteps - 1 ? (
              <>Tamamla ve Devam Et <ChevronRight size={16} /></>
            ) : step <= 2 ? (
              <>Devam <ArrowRight size={16} /></>
            ) : (
              <>Sonraki <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        {/* Skip intro */}
        {step <= 2 && (
          <button onClick={() => setStep(3)} className="text-caption text-surface-400 text-center mb-4 hover:text-primary-500 transition-colors">
            Tan\u0131t\u0131m\u0131 atla \u2192
          </button>
        )}
      </div>
    </div>
  );
}

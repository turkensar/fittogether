'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { PairingStatus, User, Notification } from '@/types';
import {
  Settings, UserCircle, Users, Moon, Sun, Bell, LogOut, Unlink, ChevronRight,
  Camera, Pencil, Globe, Info, Shield, Target, Ruler, Weight, Calendar,
} from 'lucide-react';

type Lang = 'tr' | 'en';

const T: Record<string, Record<Lang, string>> = {
  settings: { tr: 'Ayarlar', en: 'Settings' },
  account: { tr: 'Hesap', en: 'Account' },
  appearance: { tr: 'Görünüm', en: 'Appearance' },
  notifications: { tr: 'Bildirimler', en: 'Notifications' },
  about: { tr: 'Hakkında', en: 'About' },
  editProfile: { tr: 'Profili Düzenle', en: 'Edit Profile' },
  save: { tr: 'Kaydet', en: 'Save' },
  cancel: { tr: 'İptal', en: 'Cancel' },
  calorieGoal: { tr: 'Kalori Hedefi', en: 'Calorie Goal' },
  height: { tr: 'Boy', en: 'Height' },
  currentWeight: { tr: 'Mevcut Kilo', en: 'Current Weight' },
  targetWeight: { tr: 'Hedef Kilo', en: 'Target Weight' },
  age: { tr: 'Yaş', en: 'Age' },
  avatar: { tr: 'Avatar Emoji', en: 'Avatar Emoji' },
  partner: { tr: 'Partner', en: 'Partner' },
  matched: { tr: 'Eşleşti', en: 'Matched' },
  notPaired: { tr: 'Henüz eşleşilmedi', en: 'Not paired yet' },
  yourCode: { tr: 'Davet kodun', en: 'Your code' },
  findPartner: { tr: 'Partner Bul', en: 'Find Partner' },
  unmatch: { tr: 'Eşleşmeyi Kaldır', en: 'Unmatch' },
  unmatchConfirm: { tr: 'Eşleşmeyi kaldırmak istediğinden emin misin?', en: 'Are you sure you want to unmatch?' },
  yes: { tr: 'Evet', en: 'Yes' },
  no: { tr: 'Hayır', en: 'No' },
  darkMode: { tr: 'Karanlık Mod', en: 'Dark Mode' },
  darkModeDesc: { tr: 'Görünümü değiştir', en: 'Toggle appearance' },
  language: { tr: 'Dil', en: 'Language' },
  languageDesc: { tr: 'Uygulama dili', en: 'App language' },
  markAllRead: { tr: 'Tümünü okundu işaretle', en: 'Mark all read' },
  noNotifications: { tr: 'Bildirim yok', en: 'No notifications' },
  logout: { tr: 'Çıkış Yap', en: 'Logout' },
  version: { tr: 'Sürüm', en: 'Version' },
  madeWith: { tr: 'Sevgiyle yapıldı', en: 'Made with love' },
  uploadPhoto: { tr: 'Fotoğraf Yükle', en: 'Upload Photo' },
};

export default function SettingsPage() {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ daily_calorie_goal: '', avatar_emoji: '', age: '', height: '', current_weight: '', target_weight: '' });
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [lang, setLang] = useState<Lang>('tr');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => T[key]?.[lang] || key;

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
      api.get<Notification[]>('/api/social/notifications').then(setNotifications);
      setForm({
        daily_calorie_goal: String(user.daily_calorie_goal),
        avatar_emoji: user.avatar_emoji,
        age: user.age ? String(user.age) : '',
        height: user.height ? String(user.height) : '',
        current_weight: user.current_weight ? String(user.current_weight) : '',
        target_weight: user.target_weight ? String(user.target_weight) : '',
      });
    }
    setDarkMode(document.documentElement.classList.contains('dark'));
    const saved = localStorage.getItem('ft-lang');
    if (saved === 'en' || saved === 'tr') setLang(saved);
  }, [user, authLoading]);

  const toggleDark = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ft-dark', String(next));
    setDarkMode(next);
  };

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('ft-lang', l);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfilePhoto(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    try {
      const updated = await api.put<User>('/api/auth/profile', {
        daily_calorie_goal: parseInt(form.daily_calorie_goal) || 2000,
        avatar_emoji: form.avatar_emoji,
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        current_weight: form.current_weight ? parseFloat(form.current_weight) : null,
        target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
      });
      updateUser(updated);
      setEditing(false);
    } catch {}
  };

  const unmatch = async () => {
    try {
      await api.post('/api/pairing/unmatch');
      setPairing(null);
      setConfirmUnmatch(false);
    } catch {}
  };

  const markAllRead = async () => {
    await api.post('/api/social/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const handleLogout = () => { logout(); router.push('/'); };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppShell>
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-primary-500" />
          <h1 className="text-heading">{t('settings')}</h1>
        </div>

        {/* ═══ Profile Card (enlarged) ═══ */}
        <div className="card">
          <div className="flex flex-col items-center text-center pb-4 border-b border-surface-100 dark:border-surface-700 mb-4">
            {/* Avatar / photo */}
            <div className="relative mb-3">
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              {profilePhoto ? (
                <img src={profilePhoto} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100 dark:ring-primary-900/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ring-4 ring-primary-50 dark:ring-primary-900/10">
                  <span className="text-3xl">{user?.avatar_emoji || '😊'}</span>
                </div>
              )}
              <button onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
                <Camera size={13} />
              </button>
            </div>
            <h2 className="text-body font-bold text-lg">{user?.name}</h2>
            <p className="text-caption text-surface-400">{user?.email}</p>

            {!editing && (
              <button onClick={() => setEditing(true)}
                className="mt-3 btn-secondary inline-flex items-center gap-1.5 px-5 py-2 text-caption">
                <Pencil size={13} /> {t('editProfile')}
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('calorieGoal')}</label>
                  <input type="number" className="input-field" value={form.daily_calorie_goal}
                    onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('avatar')}</label>
                  <input className="input-field" value={form.avatar_emoji}
                    onChange={e => setForm(f => ({ ...f, avatar_emoji: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('age')}</label>
                  <input type="number" className="input-field" value={form.age} placeholder="-"
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('height')} (cm)</label>
                  <input type="number" className="input-field" value={form.height} placeholder="-"
                    onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('currentWeight')} (kg)</label>
                  <input type="number" step="0.1" className="input-field" value={form.current_weight} placeholder="-"
                    onChange={e => setForm(f => ({ ...f, current_weight: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-caption font-semibold mb-1">{t('targetWeight')} (kg)</label>
                  <input type="number" step="0.1" className="input-field" value={form.target_weight} placeholder="-"
                    onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">{t('cancel')}</button>
                <button onClick={saveProfile} className="btn-primary flex-1">{t('save')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { Icon: Target, label: t('calorieGoal'), value: `${user?.daily_calorie_goal} kcal` },
                { Icon: Calendar, label: t('age'), value: user?.age ? `${user.age}` : '-' },
                { Icon: Ruler, label: t('height'), value: `${user?.height || '-'} cm` },
                { Icon: Weight, label: t('currentWeight'), value: `${user?.current_weight || '-'} kg` },
                { Icon: Target, label: t('targetWeight'), value: `${user?.target_weight || '-'} kg` },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2.5 py-1.5">
                  <row.Icon size={14} className="text-surface-400 flex-shrink-0" />
                  <span className="text-body text-surface-400 flex-1">{row.label}</span>
                  <span className="text-body font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ HESAP (Account) ═══ */}
        <div>
          <h3 className="text-micro text-surface-400 uppercase tracking-wider font-semibold px-1 mb-2">
            <Shield size={12} className="inline mr-1" />{t('account')}
          </h3>

          {/* Partner */}
          <div className="card">
            <h3 className="section-title mb-3"><Users size={16} /> {t('partner')}</h3>
            {pairing?.paired ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center">
                    <Users size={16} className="text-accent-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body font-medium">{pairing.partner?.name}</p>
                    <p className="text-micro text-success">{t('matched')}</p>
                  </div>
                </div>
                {confirmUnmatch ? (
                  <div className="bg-danger/5 p-3 rounded-btn border border-danger/10">
                    <p className="text-body text-danger mb-2">{t('unmatchConfirm')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmUnmatch(false)} className="btn-secondary flex-1 py-2 text-caption">{t('no')}</button>
                      <button onClick={unmatch} className="btn-danger flex-1 py-2 text-caption">{t('yes')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmUnmatch(true)} className="flex items-center gap-1.5 text-caption text-danger font-medium">
                    <Unlink size={12} /> {t('unmatch')}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-body text-surface-400 mb-1.5">{t('notPaired')}</p>
                <p className="text-caption text-surface-400 mb-2">{t('yourCode')}: <span className="font-mono font-bold text-primary-500">{pairing?.invite_code}</span></p>
                <button onClick={() => router.push('/pairing')} className="btn-primary text-caption py-2">{t('findPartner')}</button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ GÖRÜNÜM (Appearance) ═══ */}
        <div>
          <h3 className="text-micro text-surface-400 uppercase tracking-wider font-semibold px-1 mb-2">
            {t('appearance')}
          </h3>

          <div className="space-y-2">
            {/* Dark mode */}
            <div className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                {darkMode ? <Moon size={18} className="text-primary-500" /> : <Sun size={18} className="text-yellow-500" />}
                <div>
                  <p className="text-body font-semibold">{t('darkMode')}</p>
                  <p className="text-micro text-surface-400">{t('darkModeDesc')}</p>
                </div>
              </div>
              <button onClick={toggleDark}
                className={`w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-surface-200'} relative`}>
                <div className={`bg-white rounded-full absolute top-[3px] transition-transform shadow-sm
                  ${darkMode ? 'translate-x-[22px]' : 'translate-x-[3px]'}`}
                  style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Language */}
            <div className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-primary-500" />
                <div>
                  <p className="text-body font-semibold">{t('language')}</p>
                  <p className="text-micro text-surface-400">{t('languageDesc')}</p>
                </div>
              </div>
              <div className="flex bg-surface-100 dark:bg-surface-700 rounded-btn overflow-hidden">
                <button onClick={() => switchLang('tr')}
                  className={`px-3 py-1.5 text-caption font-semibold transition-colors ${lang === 'tr' ? 'bg-primary-500 text-white' : 'text-surface-500'}`}>
                  TR
                </button>
                <button onClick={() => switchLang('en')}
                  className={`px-3 py-1.5 text-caption font-semibold transition-colors ${lang === 'en' ? 'bg-primary-500 text-white' : 'text-surface-500'}`}>
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BİLDİRİMLER (Notifications) ═══ */}
        <div>
          <h3 className="text-micro text-surface-400 uppercase tracking-wider font-semibold px-1 mb-2">
            <Bell size={12} className="inline mr-1" />{t('notifications')}
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h3>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption text-surface-400">{notifications.length > 0 ? `${notifications.length} bildirim` : ''}</span>
              <button onClick={markAllRead} className="text-micro text-primary-500 font-semibold">{t('markAllRead')}</button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {notifications.length === 0 && <p className="text-body text-surface-400">{t('noNotifications')}</p>}
              {notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`p-2.5 rounded-btn text-body ${n.is_read ? 'opacity-50' : 'bg-primary-50 dark:bg-primary-900/10'}`}>
                  <p className="text-caption font-semibold">{n.title}</p>
                  <p className="text-caption text-surface-400">{n.message}</p>
                  <p className="text-micro text-surface-300 mt-0.5">{new Date(n.created_at).toLocaleString('tr-TR')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ HAKKINDA (About) ═══ */}
        <div>
          <h3 className="text-micro text-surface-400 uppercase tracking-wider font-semibold px-1 mb-2">
            <Info size={12} className="inline mr-1" />{t('about')}
          </h3>
          <div className="card space-y-2 text-center">
            <p className="text-body font-bold">FitTogether</p>
            <p className="text-caption text-surface-400">{t('version')} 1.0.0</p>
            <p className="text-micro text-surface-300">{t('madeWith')} &hearts;</p>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full btn-danger flex items-center justify-center gap-2">
          <LogOut size={16} /> {t('logout')}
        </button>
      </div>
    </AppShell>
  );
}

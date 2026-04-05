'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { PairingStatus, User, Notification } from '@/types';
import {
  Settings, UserCircle, Users, Moon, Sun, Bell, LogOut, Unlink, ChevronRight, Check, X,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ daily_calorie_goal: '', avatar_emoji: '' });
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
      api.get<Notification[]>('/api/social/notifications').then(setNotifications);
      setForm({ daily_calorie_goal: String(user.daily_calorie_goal), avatar_emoji: user.avatar_emoji });
    }
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, [user, authLoading]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(d => !d);
  };

  const saveProfile = async () => {
    try {
      const updated = await api.put<User>('/api/auth/profile', {
        daily_calorie_goal: parseInt(form.daily_calorie_goal) || 2000,
        avatar_emoji: form.avatar_emoji,
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

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-primary-500" />
          <h1 className="text-heading">Settings</h1>
        </div>

        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <UserCircle size={24} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="text-body font-bold">{user?.name}</p>
              <p className="text-caption text-surface-400">{user?.email}</p>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-caption text-primary-500 font-semibold">Edit</button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-caption font-semibold mb-1">Daily Calorie Goal</label>
                <input type="number" className="input-field" value={form.daily_calorie_goal}
                  onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
              </div>
              <div>
                <label className="block text-caption font-semibold mb-1">Avatar Emoji</label>
                <input className="input-field" value={form.avatar_emoji}
                  onChange={e => setForm(f => ({ ...f, avatar_emoji: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveProfile} className="btn-primary flex-1">Save</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: 'Calorie Goal', value: `${user?.daily_calorie_goal} cal` },
                { label: 'Height', value: `${user?.height || '-'} cm` },
                { label: 'Current Weight', value: `${user?.current_weight || '-'} kg` },
                { label: 'Target Weight', value: `${user?.target_weight || '-'} kg` },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1">
                  <span className="text-body text-surface-400">{row.label}</span>
                  <span className="text-body font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partner */}
        <div className="card">
          <h3 className="section-title mb-3"><Users size={16} /> Partner</h3>
          {pairing?.paired ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-accent-100 dark:bg-accent-900/20 flex items-center justify-center">
                  <Users size={16} className="text-accent-500" />
                </div>
                <div className="flex-1">
                  <p className="text-body font-medium">{pairing.partner?.name}</p>
                  <p className="text-micro text-success">Matched</p>
                </div>
              </div>
              {confirmUnmatch ? (
                <div className="bg-danger/5 p-3 rounded-btn border border-danger/10">
                  <p className="text-body text-danger mb-2">Are you sure you want to unmatch?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmUnmatch(false)} className="btn-secondary flex-1 py-2 text-caption">No</button>
                    <button onClick={unmatch} className="btn-danger flex-1 py-2 text-caption">Yes, Unmatch</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmUnmatch(true)} className="flex items-center gap-1.5 text-caption text-danger font-medium">
                  <Unlink size={12} /> Unmatch
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-body text-surface-400 mb-1.5">Not paired yet</p>
              <p className="text-caption text-surface-400 mb-2">Your code: <span className="font-mono font-bold text-primary-500">{pairing?.invite_code}</span></p>
              <button onClick={() => router.push('/pairing')} className="btn-primary text-caption py-2">Find Partner</button>
            </div>
          )}
        </div>

        {/* Dark mode */}
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {darkMode ? <Moon size={18} className="text-primary-500" /> : <Sun size={18} className="text-yellow-500" />}
            <div>
              <p className="text-body font-semibold">Dark Mode</p>
              <p className="text-micro text-surface-400">Toggle appearance</p>
            </div>
          </div>
          <button onClick={toggleDark}
            className={`w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-surface-200'} relative`}>
            <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-transform shadow-sm
              ${darkMode ? 'translate-x-[22px]' : 'translate-x-[3px]'}`}
              style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title"><Bell size={16} /> Notifications</h3>
            <button onClick={markAllRead} className="text-micro text-primary-500 font-semibold">Mark all read</button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {notifications.length === 0 && <p className="text-body text-surface-400">No notifications</p>}
            {notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`p-2.5 rounded-btn text-body ${n.is_read ? 'opacity-50' : 'bg-primary-50 dark:bg-primary-900/10'}`}>
                <p className="text-caption font-semibold">{n.title}</p>
                <p className="text-caption text-surface-400">{n.message}</p>
                <p className="text-micro text-surface-300 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full btn-danger flex items-center justify-center gap-2">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { PairingStatus, User, Notification } from '@/types';

export default function SettingsPage() {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    daily_calorie_goal: '',
    avatar_emoji: '',
  });
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
      api.get<Notification[]>('/api/social/notifications').then(setNotifications);
      setForm({
        daily_calorie_goal: String(user.daily_calorie_goal),
        avatar_emoji: user.avatar_emoji,
      });
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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AppShell>
      <div className="space-y-4 pb-4">
        <h1 className="text-xl font-bold">⚙️ Settings</h1>

        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: (user?.avatar_color || '#6C63FF') + '33' }}>
              {user?.avatar_emoji}
            </div>
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Daily Calorie Goal</label>
                <input type="number" className="input-field" value={form.daily_calorie_goal}
                  onChange={e => setForm(f => ({ ...f, daily_calorie_goal: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emoji</label>
                <input className="input-field" value={form.avatar_emoji}
                  onChange={e => setForm(f => ({ ...f, avatar_emoji: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveProfile} className="btn-primary flex-1">Save</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Calorie Goal</span><span>{user?.daily_calorie_goal} cal</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Height</span><span>{user?.height || '-'} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Weight</span><span>{user?.current_weight || '-'} kg</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Target Weight</span><span>{user?.target_weight || '-'} kg</span></div>
              <button onClick={() => setEditing(true)} className="text-primary-500 text-sm font-medium mt-2">Edit Profile</button>
            </div>
          )}
        </div>

        {/* Partner */}
        <div className="card">
          <h3 className="font-semibold mb-3">Partner</h3>
          {pairing?.paired ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{pairing.partner?.avatar_emoji}</span>
                <div>
                  <p className="font-medium">{pairing.partner?.name}</p>
                  <p className="text-xs text-green-500">Matched</p>
                </div>
              </div>
              {confirmUnmatch ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-2">Are you sure you want to unmatch?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmUnmatch(false)} className="btn-secondary flex-1 text-sm py-2">No</button>
                    <button onClick={unmatch} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm flex-1">Yes, Unmatch</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmUnmatch(true)} className="text-red-400 text-sm">Unmatch</button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">Not paired yet</p>
              <p className="text-xs text-gray-400 mb-2">Your code: <span className="font-mono font-bold">{pairing?.invite_code}</span></p>
              <button onClick={() => router.push('/pairing')} className="btn-primary text-sm py-2">Find Partner</button>
            </div>
          )}
        </div>

        {/* Dark mode */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-semibold">Dark Mode</p>
            <p className="text-xs text-gray-500">Toggle dark appearance</p>
          </div>
          <button onClick={toggleDark}
            className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-gray-200'} relative`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={markAllRead} className="text-xs text-primary-500">Mark all read</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 && <p className="text-sm text-gray-400">No notifications</p>}
            {notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`p-2 rounded-lg text-sm ${n.is_read ? 'opacity-60' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                <p className="font-medium text-xs">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-xl font-medium">
          Logout
        </button>
      </div>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Home, UtensilsCrossed, MessageCircle, TrendingUp, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Ana Sayfa', Icon: Home },
  { href: '/meals', label: 'Öğünler', Icon: UtensilsCrossed },
  { href: '/chat', label: 'Mesajlar', Icon: MessageCircle },
  { href: '/progress', label: 'İlerleme', Icon: TrendingUp },
  { href: '/settings', label: 'Ayarlar', Icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      api.get<{ count: number }>('/api/social/messages/unread-count')
        .then(d => setUnreadMessages(d.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen safe-bottom">
      <main className="max-w-lg mx-auto px-4 pt-4 pb-2">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-800/95 backdrop-blur-md border-t border-surface-100 dark:border-surface-700 z-50"
        style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 min-w-[3rem] px-2 py-1.5 rounded-xl transition-all relative
                  ${active
                    ? 'text-primary-500'
                    : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'}`}>
                <item.Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-micro leading-none">{item.label}</span>
                {item.href === '/chat' && unreadMessages > 0 && (
                  <span className="absolute -top-0.5 right-0 bg-accent-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

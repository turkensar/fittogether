'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/meals', label: 'Meals', icon: '🍽️' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/progress', label: 'Progress', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
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
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative
                  ${active ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.href === '/chat' && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
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

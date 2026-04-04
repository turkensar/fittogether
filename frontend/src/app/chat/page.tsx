'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Message, PairingStatus } from '@/types';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
      loadMessages();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!polling || !user) return;
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [polling, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await api.get<Message[]>('/api/social/messages?limit=100');
      setMessages(msgs.reverse());
    } catch {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/api/social/messages', { content: text.trim() });
      setText('');
      await loadMessages();
    } catch {}
    setSending(false);
  };

  if (!pairing?.paired) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-lg font-bold mb-2">No Partner Yet</h2>
          <p className="text-gray-500 text-sm mb-4">Match with a partner to start chatting</p>
          <button onClick={() => router.push('/pairing')} className="btn-primary">Find Partner</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: (pairing.partner?.avatar_color || '#6C63FF') + '33' }}>
            {pairing.partner?.avatar_emoji}
          </div>
          <div>
            <p className="font-semibold text-sm">{pairing.partner?.name}</p>
            <p className="text-xs text-green-500">Your partner</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm pt-10">
              <p>No messages yet. Say hi! 👋</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm
                  ${isMine
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-700 rounded-bl-md'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <input
            className="input-field flex-1"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </AppShell>
  );
}

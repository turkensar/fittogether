'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Message, PairingStatus } from '@/types';
import { Send, MessageCircle, Users, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(setPairing);
      loadMessages();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user]);

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
          <MessageCircle size={48} className="text-surface-300 mb-4" />
          <h2 className="text-heading mb-2">No Partner Yet</h2>
          <p className="text-body text-surface-400 mb-4">Match with a partner to start chatting</p>
          <button onClick={() => router.push('/pairing')} className="btn-primary flex items-center gap-2">
            <Users size={16} /> Find Partner
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-surface-100 dark:border-surface-700">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Users size={18} className="text-primary-500" />
          </div>
          <div>
            <p className="text-body font-semibold">{pairing.partner?.name}</p>
            <p className="text-micro text-success">Your partner</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {messages.length === 0 && (
            <div className="text-center text-surface-400 text-body pt-10">
              <MessageCircle size={32} className="mx-auto mb-2 text-surface-300" />
              <p>No messages yet. Say hi!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-body
                  ${isMine
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-surface-100 dark:bg-surface-700 rounded-bl-md'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-micro mt-1 ${isMine ? 'text-primary-200' : 'text-surface-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
          <input
            className="input-field flex-1"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" className="btn-primary px-3" disabled={sending || !text.trim()}>
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

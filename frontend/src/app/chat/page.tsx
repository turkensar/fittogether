'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Message, PairingStatus } from '@/types';
import {
  Send, MessageCircle, Users, Loader2, Heart, Flame, Trophy, Target,
  Droplets, ArrowRight, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';

interface Comparison {
  my_name: string;
  partner_name: string;
  my_water: number;
  partner_water: number;
  my_calories: number;
  partner_calories: number;
  my_goal: number;
  partner_goal: number;
  my_challenges: number;
  partner_challenges: number;
  my_score: number;
  partner_score: number;
}

const ONBOARDING_SLIDES = [
  {
    Icon: Heart,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    title: 'Birlikte Daha Güçlü',
    desc: 'Partnerinle eşleş ve diyet yolculuğunuzu birlikte yürütün. Birbirinizi motive edin, mesajlaşın ve başarılarınızı kutlayın.',
  },
  {
    Icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    title: 'Couple Streak Kazanın',
    desc: 'İkiniz de her gün öğün kaydederse streak sayacınız artar. Birlikte tutarlı olun ve ödüller kazanın!',
  },
  {
    Icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    title: 'Challenge\'ları Birlikte Tamamlayın',
    desc: 'Günlük meydan okumaları tamamlayın, puan toplayın ve liderlik tablosunda yarışın. Kim daha çok puan toplayacak?',
  },
];

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pairing, setPairing] = useState<PairingStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      api.get<PairingStatus>('/api/pairing/status').then(data => {
        setPairing(data);
        if (data.paired) {
          api.get<Comparison>('/api/social/partner-comparison').then(setComparison).catch(() => {});
        }
      });
      loadMessages();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !pairing?.paired) return;
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user, pairing]);

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

  // Unpaired onboarding carousel
  if (!pairing?.paired) {
    const slide = ONBOARDING_SLIDES[slideIndex];
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center pt-10 text-center px-4">
          {/* Carousel */}
          <div className={`w-20 h-20 ${slide.bg} rounded-full flex items-center justify-center mb-6`}>
            <slide.Icon size={36} className={slide.color} />
          </div>

          <h2 className="text-heading mb-2">{slide.title}</h2>
          <p className="text-body text-surface-400 mb-6 max-w-sm leading-relaxed">{slide.desc}</p>

          {/* Dots + arrows */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
              disabled={slideIndex === 0}
              className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1.5">
              {ONBOARDING_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlideIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === slideIndex ? 'bg-primary-500 w-5' : 'bg-surface-300'}`} />
              ))}
            </div>
            <button onClick={() => setSlideIndex(i => Math.min(ONBOARDING_SLIDES.length - 1, i + 1))}
              disabled={slideIndex === ONBOARDING_SLIDES.length - 1}
              className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>

          <button onClick={() => router.push('/pairing')} className="btn-primary flex items-center gap-2 px-8">
            <Users size={16} /> Partner Bul
            <ArrowRight size={16} />
          </button>

          <p className="text-micro text-surface-400 mt-4">
            Eşleşmek için davet kodunu paylaş veya partnerinin kodunu gir
          </p>
        </div>
      </AppShell>
    );
  }

  // Comparison bar helper
  const CompareBar = ({ label, Icon, myVal, partnerVal, unit, flip }: {
    label: string; Icon: any; myVal: number; partnerVal: number; unit: string; flip?: boolean;
  }) => {
    const total = myVal + partnerVal || 1;
    const myPct = (myVal / total) * 100;
    const iWin = flip ? myVal < partnerVal : myVal > partnerVal;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-micro">
          <span className={`font-semibold ${iWin ? 'text-primary-500' : 'text-surface-500'}`}>
            {comparison?.my_name?.split(' ')[0] || 'Ben'}: {myVal}{unit}
          </span>
          <div className="flex items-center gap-1 text-surface-400">
            <Icon size={12} />
            <span>{label}</span>
          </div>
          <span className={`font-semibold ${!iWin ? 'text-accent-500' : 'text-surface-500'}`}>
            {comparison?.partner_name?.split(' ')[0]}: {partnerVal}{unit}
          </span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-700">
          <div className="bg-primary-500 transition-all duration-500 rounded-l-full" style={{ width: `${myPct}%` }} />
          <div className="bg-accent-400 transition-all duration-500 rounded-r-full" style={{ width: `${100 - myPct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Users size={18} className="text-primary-500" />
            </div>
            <div>
              <p className="text-body font-semibold">{pairing.partner?.name}</p>
              <p className="text-micro text-success">Partnerin</p>
            </div>
          </div>
          {comparison && (
            <button onClick={() => setShowComparison(!showComparison)}
              className={`px-2.5 py-1.5 rounded-btn text-micro font-semibold flex items-center gap-1 transition-colors
                ${showComparison ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'}`}>
              <Zap size={12} />
              Karşılaştır
            </button>
          )}
        </div>

        {/* Comparison dashboard */}
        {comparison && showComparison && (
          <div className="py-3 space-y-2.5 border-b border-surface-100 dark:border-surface-700">
            <CompareBar label="Su" Icon={Droplets} myVal={Math.round(comparison.my_water / 100) / 10} partnerVal={Math.round(comparison.partner_water / 100) / 10} unit="L" />
            <CompareBar label="Challenge" Icon={Target} myVal={comparison.my_challenges} partnerVal={comparison.partner_challenges} unit="" />
            <CompareBar label="Puan" Icon={Trophy} myVal={comparison.my_score} partnerVal={comparison.partner_score} unit="" />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          {messages.length === 0 && (
            <div className="text-center text-surface-400 text-body pt-10">
              <MessageCircle size={32} className="mx-auto mb-2 text-surface-300" />
              <p>Henüz mesaj yok. Merhaba de!</p>
            </div>
          )}
          {messages.filter(m => m.content && m.content.trim().length > 0).map(msg => {
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
            placeholder="Mesaj yaz..."
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

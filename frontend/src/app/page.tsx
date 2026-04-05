'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  UtensilsCrossed, Flame, Trophy, Droplets, MessageCircle, TrendingUp, Target,
  Heart, ArrowRight, Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.is_onboarded ? '/dashboard' : '/onboarding');
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800">
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart size={24} className="text-primary-500" />
          <span className="text-xl font-bold text-primary-500">FitTogether</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-caption">Login</Link>
          <Link href="/signup" className="btn-primary text-caption">Sign Up</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-primary-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent leading-tight">
            Diet Together, Stay Together
          </h1>
          <p className="text-lg text-surface-500 dark:text-surface-300 mb-10 leading-relaxed">
            The fun, gamified way to lose weight with your partner. Track meals, challenge each other,
            celebrate wins, and stay accountable - together.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
            Start Your Journey <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-20">
          {[
            { Icon: UtensilsCrossed, title: 'Track Meals', desc: 'Log your meals and see what your partner eats. Built-in food database with calorie tracking.' },
            { Icon: Flame, title: 'Shared Streaks', desc: 'Build streaks together. Stay motivated with shared accountability and daily challenges.' },
            { Icon: Trophy, title: 'Gamified Fun', desc: 'Earn points, badges, and compete on the couple leaderboard. Make dieting fun!' },
          ].map((f) => (
            <div key={f.title} className="card text-center p-7">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <f.Icon size={22} className="text-primary-500" />
              </div>
              <h3 className="text-body font-bold mb-2">{f.title}</h3>
              <p className="text-caption text-surface-400">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-12">
          {[
            { Icon: Droplets, title: 'Water Tracking', desc: 'Track daily water intake' },
            { Icon: MessageCircle, title: 'Private Chat', desc: 'Message your partner' },
            { Icon: TrendingUp, title: 'Progress Charts', desc: 'Visualize weight loss' },
            { Icon: Target, title: 'Daily Challenges', desc: 'Fun mini challenges' },
          ].map((f) => (
            <div key={f.title} className="card text-center p-5">
              <f.Icon size={20} className="mx-auto mb-2 text-primary-400" />
              <h4 className="text-caption font-semibold mb-0.5">{f.title}</h4>
              <p className="text-micro text-surface-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-surface-400 text-caption">
        <div className="flex items-center justify-center gap-1">
          <Heart size={12} className="text-accent-400" />
          <span>FitTogether - Made with love for couples who care</span>
        </div>
      </footer>
    </div>
  );
}

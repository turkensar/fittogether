'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.is_onboarded ? '/dashboard' : '/onboarding');
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">💫</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-primary-500">FitTogether</div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">Login</Link>
          <Link href="/signup" className="btn-primary text-sm">Sign Up</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-6xl mb-6">💑</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Diet Together, Stay Together
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            The fun, gamified way to lose weight with your partner. Track meals, challenge each other,
            celebrate wins, and stay accountable - together.
          </p>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4 inline-block">
            Start Your Journey Together
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            { emoji: '🍽️', title: 'Track Meals', desc: 'Log your meals and see what your partner eats. Built-in food database with calorie tracking.' },
            { emoji: '🔥', title: 'Shared Streaks', desc: 'Build streaks together. Stay motivated with shared accountability and daily challenges.' },
            { emoji: '🏆', title: 'Gamified Fun', desc: 'Earn points, badges, and compete on the couple leaderboard. Make dieting fun!' },
          ].map((f) => (
            <div key={f.title} className="card text-center p-8">
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-6 mt-16">
          {[
            { emoji: '💧', title: 'Water Tracking', desc: 'Track daily water intake' },
            { emoji: '💬', title: 'Private Chat', desc: 'Message your partner' },
            { emoji: '📊', title: 'Progress Charts', desc: 'Visualize weight loss' },
            { emoji: '🎯', title: 'Daily Challenges', desc: 'Fun mini challenges' },
          ].map((f) => (
            <div key={f.title} className="card text-center p-6">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h4 className="font-medium mb-1">{f.title}</h4>
              <p className="text-gray-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        FitTogether - Made with love for couples who care
      </footer>
    </div>
  );
}

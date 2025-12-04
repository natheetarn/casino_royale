'use client';

import { useState } from 'react';
import { useUser } from './UserProvider';

const DAILY_BONUS_DISPLAY = 100_000;

export function DailyBonus() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleClaim = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/rewards/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to claim daily bonus');
        setLoading(false);
        return;
      }

      if (!data.claimed) {
        if (typeof data.secondsRemaining === 'number') {
          const hours = Math.floor(data.secondsRemaining / 3600);
          const minutes = Math.floor((data.secondsRemaining % 3600) / 60);
          const parts = [];
          if (hours > 0) parts.push(`${hours}h`);
          if (minutes > 0) parts.push(`${minutes}m`);
          const text = parts.length ? parts.join(' ') : `${data.secondsRemaining}s`;
          setMessage(`Daily bonus already claimed. Next in ${text}.`);
        } else {
          setMessage('Daily bonus already claimed. Please come back later.');
        }
        setLoading(false);
        return;
      }

      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }

      setMessage(`Daily bonus claimed: ${data.amount.toLocaleString()} chips!`);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-xs text-casino-gray-light">
        <span className="block">
          Daily bonus:{' '}
          <span className="font-mono text-casino-accent-gold">
            +{DAILY_BONUS_DISPLAY.toLocaleString()}
          </span>{' '}
          chips
        </span>
        {message && (
          <span className="block text-[11px] text-casino-gray-light mt-1">
            {message}
          </span>
        )}
        {error && (
          <span className="block text-[11px] text-casino-accent-primary mt-1">
            {error}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-casino-accent-primary text-casino-white hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow shadow-casino-accent-primary/40"
      >
        {loading ? 'Claiming…' : 'Claim Daily Chips'}
      </button>
    </div>
  );
}



'use client';

import { useEffect, useState } from 'react';
import { useUser } from './UserProvider';

interface LeaderboardEntry {
  rank: number;
  balance?: number;
  total_winnings?: number;
  games_played?: number;
  user_id: string;
  users: {
    username: string;
    created_at: string;
  };
}

interface BiggestWin {
  rank: number;
  winnings: number;
  game_type: string;
  timestamp: string;
  user_id: string;
  users: {
    username: string;
  };
}

type LeaderboardType = 'balance' | 'winnings' | 'games';
type PeriodType = 'all' | 'daily' | 'weekly' | 'monthly';

export function Leaderboard() {
  const { user } = useUser();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('balance');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [biggestWins, setBiggestWins] = useState<BiggestWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType]);

  useEffect(() => {
    fetchBiggestWins();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?type=${leaderboardType}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      setLeaderboard(data.leaderboard || []);
      setError(null);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchBiggestWins = async () => {
    try {
      const response = await fetch(`/api/leaderboard/biggest-wins?limit=5&period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch biggest wins');
      }

      setBiggestWins(data.biggestWins || []);
    } catch (err) {
      console.error('Biggest wins fetch error:', err);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    const isCurrentUser = user?.id === entry.user_id;
    const value = entry.balance || entry.total_winnings || entry.games_played || 0;
    const isBalance = leaderboardType === 'balance';
    const isWinnings = leaderboardType === 'winnings';

    return (
      <div
        key={entry.user_id}
        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
          isCurrentUser
            ? 'border-casino-accent-secondary bg-casino-accent-secondary/10 shadow-lg shadow-casino-accent-secondary/20'
            : 'border-casino-gray-darker bg-casino-black-lighter hover:border-casino-gray'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-bold ${
            isCurrentUser ? 'text-casino-accent-secondary' : 'text-casino-white'
          }`}>
            {getRankEmoji(entry.rank)}
          </div>
          <div>
            <div className={`font-semibold ${
              isCurrentUser ? 'text-casino-accent-secondary' : 'text-casino-white'
            }`}>
              {entry.users.username}
              {isCurrentUser && ' (You)'}
            </div>
            <div className="text-sm text-casino-gray-light">
              Joined {formatDate(entry.users.created_at)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-mono font-bold ${
            isCurrentUser ? 'text-casino-accent-secondary' : 'text-casino-accent-gold'
          }`}>
            {isBalance && '🪙 '}
            {isWinnings && '💰 '}
            {formatAmount(value)}
          </div>
          <div className="text-xs text-casino-gray-light">
            {isBalance && 'Chips'}
            {isWinnings && 'Total Won'}
            {leaderboardType === 'games' && 'Games Played'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-display text-casino-white mb-2">🏆 Leaderboard</h1>
        <p className="text-casino-gray-light">Compete with friends and climb the rankings!</p>
      </div>

      {/* Leaderboard Type Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-casino-black-lighter border border-casino-gray-darker rounded-lg p-1">
          {([
            { value: 'balance', label: '💰 Richest', icon: '🪙' },
            { value: 'winnings', label: '💎 Winners', icon: '💰' },
            { value: 'games', label: '🎮 Players', icon: '🎯' }
          ] as const).map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setLeaderboardType(value)}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                leaderboardType === value
                  ? 'bg-casino-accent-primary text-casino-white shadow-lg'
                  : 'text-casino-gray-light hover:text-casino-white hover:bg-casino-gray-darker'
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-casino-white mb-2">
            {leaderboardType === 'balance' && '💰 Richest Players'}
            {leaderboardType === 'winnings' && '💎 Biggest Winners'}
            {leaderboardType === 'games' && '🎮 Most Games Played'}
          </h2>
          <p className="text-casino-gray-light">
            Top 10 players based on {leaderboardType === 'balance' ? 'current chip balance' :
                              leaderboardType === 'winnings' ? 'all-time winnings' : 'total games played'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-casino-gray-light">Loading leaderboard...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">❌ {error}</div>
            <button
              onClick={fetchLeaderboard}
              className="px-4 py-2 bg-casino-accent-primary text-casino-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-casino-gray-light">
            No data available yet. Start playing to appear on the leaderboard!
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map(renderLeaderboardEntry)}
          </div>
        )}
      </div>

      {/* Biggest Wins Section */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-casino-white mb-2">🎉 Biggest Wins</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex bg-casino-black border border-casino-gray rounded-lg p-1">
              {([
                { value: 'all', label: 'All Time' },
                { value: 'daily', label: 'Today' },
                { value: 'weekly', label: 'This Week' },
                { value: 'monthly', label: 'This Month' }
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                    period === value
                      ? 'bg-casino-accent-primary text-casino-white'
                      : 'text-casino-gray-light hover:text-casino-white hover:bg-casino-gray'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {biggestWins.length === 0 ? (
          <div className="text-center py-8 text-casino-gray-light">
            No big wins yet this period!
          </div>
        ) : (
          <div className="space-y-3">
            {biggestWins.map((win) => (
              <div
                key={`${win.user_id}-${win.timestamp}`}
                className="flex items-center justify-between p-4 rounded-lg border border-casino-gray-darker bg-casino-black hover:border-casino-gray transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {win.game_type === 'slots' && '🎰'}
                    {win.game_type === 'landmines' && '💣'}
                    {win.game_type === 'crash' && '📈'}
                    {win.game_type === 'roulette' && '🎰'}
                    {win.game_type === 'baccarat' && '🃏'}
                  </div>
                  <div>
                    <div className="font-semibold text-casino-white">
                      {win.users.username}
                    </div>
                    <div className="text-sm text-casino-gray-light">
                      {win.game_type.charAt(0).toUpperCase() + win.game_type.slice(1)} • {formatDate(win.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-casino-accent-gold">
                    🪙 {formatAmount(win.winnings)}
                  </div>
                  <div className="text-xs text-casino-gray-light">Won</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {user && (
        <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
          <h3 className="text-lg font-bold text-casino-white mb-4">📊 Your Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-casino-black border border-casino-gray">
              <div className="text-2xl mb-2">🪙</div>
              <div className="text-xl font-mono font-bold text-casino-accent-gold">
                {formatAmount(user.chip_balance)}
              </div>
              <div className="text-sm text-casino-gray-light">Current Balance</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-casino-black border border-casino-gray">
              <div className="text-2xl mb-2">🎮</div>
              <div className="text-xl font-mono font-bold text-casino-accent-primary">
                {/* This would come from user stats API */}
                --
              </div>
              <div className="text-sm text-casino-gray-light">Games Played</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-casino-black border border-casino-gray">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-xl font-mono font-bold text-casino-accent-secondary">
                {/* This would come from achievements API */}
                --
              </div>
              <div className="text-sm text-casino-gray-light">Achievements</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
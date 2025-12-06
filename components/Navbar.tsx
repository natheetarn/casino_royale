'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from './UserProvider';

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useUser();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-casino-black-lighter border-b border-casino-gray-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-display text-casino-white">
              Casino Royale
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="text-casino-gray-light hover:text-casino-white transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="text-casino-gray-light hover:text-casino-white transition-colors duration-200"
              >
                🏆 Leaderboard
              </Link>
              {user.chip_balance === 0 && (
                <Link
                  href="/tasks"
                  className="text-casino-gray-light hover:text-casino-white transition-colors duration-200"
                >
                  Tasks
                </Link>
              )}
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="text-casino-gray-light hover:text-casino-white transition-colors duration-200"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-casino-gray-light uppercase tracking-wide">Balance</div>
              <div className="text-xl font-mono text-casino-accent-gold">
                {user.chip_balance.toLocaleString()}
              </div>
            </div>
            <div className="text-casino-gray-light">@{user.username}</div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-casino-gray-darker hover:bg-casino-gray-dark border border-casino-gray text-casino-white rounded-lg transition-colors duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}


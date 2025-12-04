import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { DailyBonus } from '@/components/DailyBonus';
import Link from 'next/link';
import { getActiveGames } from '@/lib/games/registry';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const supabase = createServerClient();
  
  // Get recent game history
  const { data: gameHistory } = await supabase
    .from('game_history')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(10);

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(10);

  // Get active games from registry
  const activeGames = getActiveGames();

  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display text-casino-white mb-2">
            Welcome back, {user.username}
          </h1>
          <p className="text-casino-gray-light">Ready to test your luck?</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-casino-gray-darker to-casino-black-lighter rounded-xl p-6 mb-8 border border-casino-gray">
          <p className="text-sm text-casino-gray-light uppercase tracking-wide">
            Your Balance
          </p>
          <p className="text-4xl md:text-5xl font-mono text-casino-accent-gold mt-2">
            {user.chip_balance.toLocaleString()}
          </p>
          <p className="text-xs text-casino-gray-light mt-1">chips</p>

          {/* Daily bonus claim */}
          <DailyBonus />
        </div>

        {/* Tasks Section (only when balance = 0) */}
        {user.chip_balance === 0 && (
          <div className="mb-8">
            <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
              <h2 className="text-2xl font-display text-casino-white mb-2">Tedious Tasks</h2>
              <p className="text-casino-gray-light text-sm mb-4">
                Complete tasks to earn chips and get back in the game
              </p>
              <Link
                href="/tasks"
                className="inline-block px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150"
              >
                View Tasks
              </Link>
            </div>
          </div>
        )}

        {/* Games Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display text-casino-white mb-4">Games</h2>
          {/* Responsive game grid so we can keep adding titles without breaking layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeGames.map((game) => (
              <Link
                key={game.id}
                href={game.route}
                className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 hover:border-casino-gray-dark transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-display text-casino-white mb-2">
                  {game.emoji} {game.name}
                </h3>
                <p className="text-casino-gray-light text-sm">{game.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game History */}
          <div className="bg-casino-gray-darker rounded-lg p-6">
            <h2 className="text-xl font-sans font-semibold text-casino-white mb-4">Recent Games</h2>
            {gameHistory && gameHistory.length > 0 ? (
              <div className="space-y-2">
                {gameHistory.map((game) => (
                  <div
                    key={game.id}
                    className="flex justify-between items-center p-3 bg-casino-black-lighter rounded-lg border border-casino-gray-darker"
                  >
                    <div>
                      <div className="font-semibold text-casino-white">{game.game_type}</div>
                      <div className="text-sm text-casino-gray-light">
                        Bet: {game.bet_amount} • {game.result}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${
                        game.winnings > 0
                          ? 'text-casino-accent-secondary'
                          : game.winnings < 0
                          ? 'text-casino-accent-primary'
                          : 'text-casino-gray-light'
                      }`}
                    >
                      {game.winnings > 0 ? '+' : ''}
                      {game.winnings}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-casino-gray-light">No games played yet</p>
            )}
          </div>

          {/* Transactions */}
          <div className="bg-casino-gray-darker rounded-lg p-6">
            <h2 className="text-xl font-sans font-semibold text-casino-white mb-4">Recent Transactions</h2>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-casino-black-lighter rounded-lg border border-casino-gray-darker"
                  >
                    <div>
                      <div className="font-semibold text-casino-white">
                        {tx.game_type || tx.reason || 'Transaction'}
                      </div>
                      <div className="text-sm text-casino-gray-light">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${
                        tx.amount > 0 ? 'text-casino-accent-secondary' : 'text-casino-accent-primary'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-casino-gray-light">No transactions yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


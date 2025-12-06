import { Leaderboard } from '@/components/Leaderboard';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function LeaderboardPage() {
  const user = await getSession();

  return (
    <div className="min-h-screen bg-casino-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Leaderboard />
      </div>
    </div>
  );
}
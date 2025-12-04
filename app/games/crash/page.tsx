import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';
import { CrashGame } from '@/components/games/CrashGame';

export default async function CrashPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login?redirect=/games/crash');
  }

  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <CrashGame initialBalance={user.chip_balance} />
      </main>
    </div>
  );
}



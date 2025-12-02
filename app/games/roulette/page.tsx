import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';
import { createServerClient } from '@/lib/supabase';
import { RouletteGame } from '@/components/games/RouletteGame';

export default async function RoulettePage() {
  const user = await getSession();

  if (!user) {
    redirect('/login?redirect=/games/roulette');
  }

  const supabase = createServerClient();
  const { data: currentUser } = await supabase
    .from('users')
    .select('chip_balance')
    .eq('id', user.id)
    .single();

  const balance = currentUser?.chip_balance ?? user.chip_balance;

  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <RouletteGame initialBalance={balance} />
      </main>
    </div>
  );
}


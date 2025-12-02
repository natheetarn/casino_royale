import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AdminPanel from '@/components/AdminPanel';

export default async function AdminPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (!user.is_admin) {
    redirect('/dashboard');
  }

  const supabase = createServerClient();
  
  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, chip_balance, is_admin, created_at')
    .order('chip_balance', { ascending: false });

  // Get all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);

  // Get usernames for transactions
  const userIds = [...new Set(transactions?.map(tx => tx.user_id) || [])];
  const { data: usersMap } = await supabase
    .from('users')
    .select('id, username')
    .in('id', userIds);

  const usernameMap = new Map(usersMap?.map(u => [u.id, u.username]) || []);
  
  const transactionsWithUsers = transactions?.map(tx => ({
    ...tx,
    users: { username: usernameMap.get(tx.user_id) || 'Unknown' }
  })) || [];

  return (
    <div className="min-h-screen bg-casino-dark">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-neon-pink mb-8">Admin Panel</h1>
        <AdminPanel users={users || []} transactions={transactionsWithUsers} />
      </main>
    </div>
  );
}


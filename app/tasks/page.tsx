import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';
import { TasksHub } from '@/components/tasks/TasksHub';

export default async function TasksPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login?redirect=/tasks');
  }

  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <TasksHub />
      </main>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../UserProvider';
import { TaskCard } from './TaskCard';
import { MathTask } from './MathTask';
import { TriviaTask } from './TriviaTask';
import { CaptchaTask } from './CaptchaTask';
import { TypingTask } from './TypingTask';
import { WaitingTask } from './WaitingTask';

interface Task {
  type: string;
  reward: number;
  cooldownSeconds: number;
  cooldownRemaining: number;
  isOnCooldown: boolean;
  canStart: boolean;
}

const TASK_NAMES: Record<string, { name: string; emoji: string }> = {
  math: { name: 'Math Homework', emoji: '📐' },
  trivia: { name: 'Trivia Quiz', emoji: '🧠' },
  captcha: { name: 'CAPTCHA Hell', emoji: '🤖' },
  typing: { name: 'Typing Test', emoji: '⌨️' },
  waiting: { name: 'The Waiting Game', emoji: '⏳' },
};

export function TasksHub() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    // Refresh tasks every 5 seconds to update cooldowns
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks/list');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load tasks');
        return;
      }

      setAvailable(data.available);
      setTasks(data.tasks || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const handleStartTask = (taskType: string) => {
    setActiveTask(taskType);
  };

  const handleTaskComplete = () => {
    setActiveTask(null);
    fetchTasks();
    // User balance is updated by individual task components via UserProvider
  };

  const handleTaskCancel = () => {
    setActiveTask(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-casino-gray-light">Loading tasks...</p>
      </div>
    );
  }

  if (!available) {
    return (
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-8 text-center">
        <p className="text-lg text-casino-white mb-2">Tasks Unavailable</p>
        <p className="text-casino-gray-light">
          Tasks are only available when your balance is 0.
        </p>
        <p className="text-sm text-casino-gray-light mt-2">
          Current balance: <span className="font-mono text-casino-accent-gold">{user?.chip_balance.toLocaleString() || 0}</span> chips
        </p>
      </div>
    );
  }

  if (activeTask) {
    const taskProps = {
      onComplete: handleTaskComplete,
      onCancel: handleTaskCancel,
    };

    switch (activeTask) {
      case 'math':
        return <MathTask {...taskProps} />;
      case 'trivia':
        return <TriviaTask {...taskProps} />;
      case 'captcha':
        return <CaptchaTask {...taskProps} />;
      case 'typing':
        return <TypingTask {...taskProps} />;
      case 'waiting':
        return <WaitingTask {...taskProps} />;
      default:
        return null;
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-8 text-center">
        <p className="text-casino-gray-light">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-display text-casino-white mb-2">
          Tedious Tasks
        </h2>
        <p className="text-casino-gray-light text-sm">
          Complete tasks to earn chips. Each task has a cooldown period.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.type}
            type={task.type}
            name={TASK_NAMES[task.type]?.name || task.type}
            emoji={TASK_NAMES[task.type]?.emoji || '📋'}
            reward={task.reward}
            cooldownRemaining={task.cooldownRemaining}
            isOnCooldown={task.isOnCooldown}
            canStart={task.canStart}
            onStart={() => handleStartTask(task.type)}
          />
        ))}
      </div>
    </div>
  );
}


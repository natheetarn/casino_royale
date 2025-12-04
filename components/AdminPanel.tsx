'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  chip_balance: number;
  is_admin: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  game_type: string | null;
  amount: number;
  balance_after: number;
  reason: string | null;
  timestamp: string;
  users?: { username: string };
}

interface TaskConfig {
  task_type: string;
  reward_amount: number;
  cooldown_seconds: number;
  updated_at: string;
  updated_by: string | null;
}

interface AdminPanelProps {
  users: User[];
  transactions: Transaction[];
}

const TASK_NAMES: Record<string, string> = {
  math: 'Math Homework',
  trivia: 'Trivia Quiz',
  captcha: 'CAPTCHA Hell',
  typing: 'Typing Test',
  waiting: 'The Waiting Game',
};

export default function AdminPanel({ users: initialUsers, transactions: initialTransactions }: AdminPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [chipAmount, setChipAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Task config state
  const [taskConfigs, setTaskConfigs] = useState<TaskConfig[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editReward, setEditReward] = useState('');
  const [editCooldown, setEditCooldown] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTaskConfigs();
  }, []);

  const fetchTaskConfigs = async () => {
    try {
      const res = await fetch('/api/admin/tasks/config');
      const data = await res.json();
      if (res.ok && data.configs) {
        setTaskConfigs(data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch task configs:', error);
    }
  };

  const handleEditTask = (task: TaskConfig) => {
    setEditingTask(task.task_type);
    setEditReward(task.reward_amount.toString());
    setEditCooldown(task.cooldown_seconds.toString());
    setConfigMessage(null);
  };

  const handleSaveTask = async (taskType: string) => {
    const reward = parseInt(editReward, 10);
    const cooldown = parseInt(editCooldown, 10);

    if (isNaN(reward) || reward < 0) {
      setConfigMessage({ type: 'error', text: 'Invalid reward amount' });
      return;
    }

    if (isNaN(cooldown) || cooldown < 0) {
      setConfigMessage({ type: 'error', text: 'Invalid cooldown seconds' });
      return;
    }

    setConfigLoading(true);
    setConfigMessage(null);

    try {
      const res = await fetch('/api/admin/tasks/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          rewardAmount: reward,
          cooldownSeconds: cooldown,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setConfigMessage({ type: 'error', text: data.error || 'Failed to update task configuration' });
        setConfigLoading(false);
        return;
      }

      setTaskConfigs((prev) =>
        prev.map((t) => (t.task_type === taskType ? data.config : t))
      );
      setEditingTask(null);
      setConfigMessage({ type: 'success', text: 'Task configuration updated successfully' });
      setConfigLoading(false);
    } catch (error) {
      setConfigMessage({ type: 'error', text: 'An error occurred' });
      setConfigLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditReward('');
    setEditCooldown('');
    setConfigMessage(null);
  };

  const handleAddChips = async () => {
    if (!selectedUser || !chipAmount) {
      setMessage({ type: 'error', text: 'Please select a user and enter an amount' });
      return;
    }

    const amount = parseInt(chipAmount);
    if (isNaN(amount) || amount === 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/add-chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          amount,
          reason: reason || 'Admin adjustment',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add chips' });
        setLoading(false);
        return;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser
            ? { ...u, chip_balance: data.newBalance }
            : u
        )
      );

      // Add new transaction to list
      setTransactions((prev) => [data.transaction, ...prev]);

      setMessage({ type: 'success', text: `Added ${amount} chips to ${users.find((u) => u.id === selectedUser)?.username}` });
      setChipAmount('');
      setReason('');
      setSelectedUser(null);
      setLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Task Configuration Section */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <h2 className="text-2xl font-display text-casino-white mb-4">Task Rewards & Cooldowns</h2>
        
        {configMessage && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              configMessage.type === 'success'
                ? 'bg-casino-accent-secondary/10 border border-casino-accent-secondary text-casino-accent-secondary'
                : 'bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary'
            }`}
          >
            {configMessage.text}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-casino-gray-darker">
                <th className="text-left py-3 px-4 text-casino-gray-light">Task</th>
                <th className="text-right py-3 px-4 text-casino-gray-light">Reward (chips)</th>
                <th className="text-right py-3 px-4 text-casino-gray-light">Cooldown (seconds)</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskConfigs.map((task) => (
                <tr key={task.task_type} className="border-b border-casino-gray-darker hover:bg-casino-gray-darker transition-colors">
                  <td className="py-3 px-4 text-casino-white font-semibold">
                    {TASK_NAMES[task.task_type] || task.task_type}
                  </td>
                  {editingTask === task.task_type ? (
                    <>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editReward}
                          onChange={(e) => setEditReward(e.target.value)}
                          className="w-full px-3 py-2 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white font-mono text-right focus:outline-none focus:border-casino-accent-primary"
                          min="0"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editCooldown}
                          onChange={(e) => setEditCooldown(e.target.value)}
                          className="w-full px-3 py-2 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white font-mono text-right focus:outline-none focus:border-casino-accent-primary"
                          min="0"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTask(task.task_type)}
                            disabled={configLoading}
                            className="px-3 py-1 bg-casino-accent-secondary text-casino-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={configLoading}
                            className="px-3 py-1 bg-casino-gray-darker border border-casino-gray text-casino-gray-light text-sm rounded hover:bg-casino-gray-dark transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-right font-mono text-casino-accent-gold">
                        {task.reward_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-casino-white">
                        {task.cooldown_seconds.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1 bg-casino-accent-primary text-casino-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Chips Section */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <h2 className="text-2xl font-display text-casino-white mb-4">Add Chips to User</h2>
        
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-casino-accent-secondary/10 border border-casino-accent-secondary text-casino-accent-secondary'
                : 'bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-casino-gray-light mb-2 text-sm">Select User</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.chip_balance.toLocaleString()} chips)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-casino-gray-light mb-2 text-sm">Chip Amount</label>
            <input
              type="number"
              value={chipAmount}
              onChange={(e) => setChipAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-casino-gray-light mb-2 text-sm">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adjustment"
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>
        </div>

        <button
          onClick={handleAddChips}
          disabled={loading || !selectedUser || !chipAmount}
          className="mt-4 px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Chips'}
        </button>
      </div>

      {/* Users List */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <h2 className="text-2xl font-display text-casino-white mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-casino-gray-darker">
                <th className="text-left py-3 px-4 text-casino-gray-light">Username</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Email</th>
                <th className="text-right py-3 px-4 text-casino-gray-light">Balance</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Role</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-casino-gray-darker hover:bg-casino-gray-darker transition-colors">
                  <td className="py-3 px-4 text-casino-white font-semibold">{user.username}</td>
                  <td className="py-3 px-4 text-casino-gray-light">{user.email}</td>
                  <td className="py-3 px-4 text-right font-mono text-casino-accent-gold">
                    {user.chip_balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {user.is_admin ? (
                      <span className="px-2 py-1 bg-casino-accent-primary text-casino-white text-xs font-semibold rounded">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-casino-gray text-casino-white text-xs rounded">
                        User
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-casino-gray-light text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <h2 className="text-2xl font-display text-casino-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-casino-gray-darker">
                <th className="text-left py-3 px-4 text-casino-gray-light">User</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Type</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Reason</th>
                <th className="text-right py-3 px-4 text-casino-gray-light">Amount</th>
                <th className="text-right py-3 px-4 text-casino-gray-light">Balance After</th>
                <th className="text-left py-3 px-4 text-casino-gray-light">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-casino-gray-darker hover:bg-casino-gray-darker transition-colors">
                  <td className="py-3 px-4 text-casino-white">
                    {tx.users?.username || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-casino-gray-light">{tx.game_type || 'Manual'}</td>
                  <td className="py-3 px-4 text-casino-gray-light">{tx.reason || '-'}</td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      tx.amount > 0 ? 'text-casino-accent-secondary' : 'text-casino-accent-primary'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-casino-accent-gold">
                    {tx.balance_after.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-casino-gray-light text-sm">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


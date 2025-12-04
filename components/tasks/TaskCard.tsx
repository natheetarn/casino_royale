'use client';

interface TaskCardProps {
  type: string;
  name: string;
  emoji: string;
  reward: number;
  cooldownRemaining: number;
  isOnCooldown: boolean;
  canStart: boolean;
  onStart: () => void;
}

export function TaskCard({
  type,
  name,
  emoji,
  reward,
  cooldownRemaining,
  isOnCooldown,
  canStart,
  onStart,
}: TaskCardProps) {
  const formatCooldown = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 hover:border-casino-gray-dark transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-display text-casino-white mb-1">
            {emoji} {name}
          </h3>
          <p className="text-sm text-casino-gray-light">
            Reward: <span className="font-mono text-casino-accent-gold">{reward.toLocaleString()}</span> chips
          </p>
        </div>
      </div>

      {isOnCooldown && (
        <div className="mb-4 p-3 bg-casino-gray-darker rounded-lg border border-casino-gray">
          <p className="text-xs text-casino-gray-light mb-1">Cooldown</p>
          <p className="text-sm font-mono text-casino-white">
            {formatCooldown(cooldownRemaining)} remaining
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-150 ${
          canStart
            ? 'bg-casino-accent-primary text-casino-white hover:bg-red-700 active:scale-95 shadow-lg shadow-casino-accent-primary/30'
            : 'bg-casino-gray-darker text-casino-gray-light cursor-not-allowed opacity-60'
        }`}
      >
        {isOnCooldown ? 'On Cooldown' : 'Start Task'}
      </button>
    </div>
  );
}


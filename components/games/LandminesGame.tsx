'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../UserProvider';
import { brainrotLandmines } from '@/copy/brainrot';
import { BetSelector } from './BetSelector';

const DEFAULT_GRID_SIZE = 5;
const DEFAULT_MINE_COUNT = 5;
const DEFAULT_BET_OPTIONS = [10, 50, 100, 500, 1000];

type GameState = 'idle' | 'in-progress' | 'hit-mine' | 'cashed-out';

interface LandminesSession {
  id: string;
  gridSize: number;
  mineCount: number;
  safeRevealed: number;
  isActive: boolean;
}

interface RevealResponse {
  success: boolean;
  hitMine: boolean;
  cellIndex: number;
  safeRevealed: number;
  multiplier: number;
}

interface CashoutResponse {
  success: boolean;
  payout: number;
  netWinnings: number;
  balance: number;
  multiplier: number;
  safeRevealed: number;
}

export function LandminesGame({ initialBalance }: { initialBalance: number }) {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [mineCount, setMineCount] = useState(DEFAULT_MINE_COUNT);
  const [selectedBet, setSelectedBet] = useState<number>(50);
  const [session, setSession] = useState<LandminesSession | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [revealedCells, setRevealedCells] = useState<Set<number>>(new Set());
  const [lastMultiplier, setLastMultiplier] = useState<number>(1);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hitMineIndex, setHitMineIndex] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(initialBalance);

  const { user, setUser } = useUser();

  const [multiplierShake, setMultiplierShake] = useState(false);
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!multiplierShake) return;
    const timeout = setTimeout(() => setMultiplierShake(false), 400);
    return () => clearTimeout(timeout);
  }, [multiplierShake]);

  const canStart =
    gameState !== 'in-progress' &&
    selectedBet > 0 &&
    balance >= selectedBet &&
    mineCount >= 1 &&
    mineCount < gridSize * gridSize;

  const canReveal =
    session && session.isActive && gameState === 'in-progress';

  const canCashout =
    session &&
    session.isActive &&
    gameState === 'in-progress' &&
    session.safeRevealed > 0;

  const handleStart = async () => {
    if (!canStart) return;
    setError(null);
    setLastPayout(null);
    setLastMultiplier(1);
    setRevealedCells(new Set());
    setHitMineIndex(null);
    setLastRevealedIndex(null);

    try {
      const res = await fetch('/api/games/landmines/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: selectedBet,
          gridSize,
          mineCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start game');
        return;
      }

      setSession(data.session);
      setGameState('in-progress');
      setBalance(data.balance);
      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleReveal = async (index: number) => {
    if (!canReveal || !session) return;
    if (revealedCells.has(index)) return;

    setError(null);

    try {
      const res = await fetch('/api/games/landmines/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          cellIndex: index,
        }),
      });

      const data: RevealResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reveal cell');
        return;
      }

      const nextRevealed = new Set(revealedCells);
      nextRevealed.add(index);
      setRevealedCells(nextRevealed);

      setLastMultiplier(data.multiplier);
      setLastRevealedIndex(index);
      setMultiplierShake(true);

      if (data.hitMine) {
        setGameState('hit-mine');
        setHitMineIndex(index);
        setSession((prev) =>
          prev ? { ...prev, isActive: false } : prev
        );
      } else {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                safeRevealed: data.safeRevealed,
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleCashout = async () => {
    if (!canCashout || !session) return;

    setError(null);

    try {
      const res = await fetch('/api/games/landmines/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const data: CashoutResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to cash out');
        return;
      }

      setGameState('cashed-out');
      setSession((prev) =>
        prev ? { ...prev, isActive: false } : prev
      );
      setLastMultiplier(data.multiplier);
      setMultiplierShake(true);
      setLastPayout(data.payout);
      setBalance(data.balance);
      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleReset = () => {
    setSession(null);
    setGameState('idle');
    setRevealedCells(new Set());
    setLastMultiplier(1);
    setLastPayout(null);
    setError(null);
    setHitMineIndex(null);
    setLastRevealedIndex(null);
  };

  const handleNewRound = async () => {
    if (gameState === 'in-progress') return;
    handleReset();
    await handleStart();
  };

  const getPrimaryButtonLabel = () => {
    if (gameState === 'in-progress') return 'Game in Progress';
    if (!session || gameState === 'idle') return 'Start Game';
    return 'New Round';
  };

  const renderCell = (index: number) => {
    const isRevealed = revealedCells.has(index);
    const isDisabled = !session || !session.isActive || gameState !== 'in-progress';
    const isBomb = hitMineIndex !== null && index === hitMineIndex;
    const isLastSafe =
      isRevealed && !isBomb && lastRevealedIndex !== null && index === lastRevealedIndex;

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleReveal(index)}
        disabled={isDisabled || isRevealed}
        className={`aspect-square rounded-lg flex items-center justify-center text-xl font-mono transition-colors transition-transform duration-150 border ${
          isRevealed
            ? isBomb
              ? 'bg-casino-accent-primary/25 border-casino-accent-primary text-casino-accent-primary'
              : `bg-casino-accent-secondary/25 border-casino-accent-secondary text-casino-accent-secondary ${
                  isLastSafe ? 'animate-multiplier-shake' : ''
                }`
            : 'bg-casino-gray-darker border-casino-black-lighter text-casino-white hover:bg-casino-black-lighter hover:-translate-y-0.5'
        } ${
          isDisabled ? 'cursor-not-allowed opacity-60 hover:translate-y-0' : 'cursor-pointer'
        }`}
      >
        {isRevealed ? (
          isBomb ? (
            '💣'
          ) : isLastSafe ? (
            <span className="text-2xl md:text-3xl font-mono">
              {lastMultiplier.toFixed(2)}×
            </span>
          ) : (
            ''
          )
        ) : (
          ''
        )}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-casino-white">Landmines</h1>
          <p className="text-sm text-casino-gray-light mt-1">
            {brainrotLandmines.subtitle()}
          </p>
        </div>
        <div className="flex items-end gap-6">
          <div className="text-right">
            <p className="text-sm text-casino-gray-light">Balance</p>
            <p className="text-2xl font-mono text-casino-accent-gold">
              {balance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-casino-gray-light uppercase tracking-wide">
              Multiplier
            </p>
            <p
              className={`text-3xl md:text-4xl font-mono text-casino-accent-secondary ${
                multiplierShake ? 'animate-multiplier-shake' : ''
              }`}
            >
              {lastMultiplier.toFixed(2)}×
            </p>
          </div>
        </div>
      </div>

      {/* Main layout: grid left, controls right on desktop */}
      <div className="md:flex md:items-start md:gap-8 md:space-y-0 space-y-8">
        {/* Grid */}
        <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-4 md:flex-[3]">
          <div
            className="grid gap-x-1 gap-y-1 w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) => renderCell(i))}
          </div>
        </div>

        {/* Controls + Info */}
        <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6 md:flex-[2] md:w-full">
          <div className="space-y-3">
            {/* Bet amount */}
            <BetSelector
              balance={balance}
              selectedBet={selectedBet}
              onBetChange={setSelectedBet}
              presetOptions={DEFAULT_BET_OPTIONS}
            />

            {/* Sliders + helper text */}
            <div className="text-sm text-casino-gray-light space-y-4">
              {/* Grid size slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-casino-gray-light">
                    Grid Size
                  </span>
                  <span className="text-xs font-mono text-casino-white">
                    {gridSize}×{gridSize}
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  step={1}
                  value={gridSize}
                  disabled={gameState === 'in-progress'}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (Number.isNaN(value)) return;
                    const clamped = Math.min(8, Math.max(3, value));
                    if (gameState === 'in-progress') return;
                    setGridSize(clamped);
                    const maxMines = clamped * clamped - 1;
                    if (mineCount >= maxMines) {
                      setMineCount(Math.max(1, maxMines));
                    }
                  }}
                  className="w-full accent-casino-accent-primary"
                />
                <div className="flex justify-between text-[10px] text-casino-gray-light font-mono">
                  <span>{brainrotLandmines.gridSizeHelper().left}</span>
                  <span>{brainrotLandmines.gridSizeHelper().right}</span>
                </div>
              </div>

              {/* Mines slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-casino-gray-light">
                    Mines
                  </span>
                  <span className="text-xs font-mono text-casino-accent-primary">
                    {mineCount} / {gridSize * gridSize - 1}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(2, gridSize * gridSize - 1)}
                  step={1}
                  value={mineCount}
                  disabled={gameState === 'in-progress'}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (Number.isNaN(value)) return;
                    const maxMines = gridSize * gridSize - 1;
                    const clamped = Math.min(maxMines, Math.max(1, value));
                    if (gameState === 'in-progress') return;
                    setMineCount(clamped);
                  }}
                  className="w-full accent-casino-accent-primary"
                />
                <div className="flex justify-between text-[10px] text-casino-gray-light font-mono">
                  <span>{brainrotLandmines.minesHelper().left}</span>
                  <span>{brainrotLandmines.minesHelper().right}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p>{brainrotLandmines.safeRevealed(session?.safeRevealed ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex flex-col gap-3 items-stretch md:items-end justify-center">
            <button
              type="button"
              onClick={handleNewRound}
              disabled={gameState === 'in-progress' || !canStart}
              className="w-full md:w-auto px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getPrimaryButtonLabel()}
            </button>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleCashout}
                disabled={!canCashout}
                className="flex-1 px-4 py-3 bg-casino-gray-darker border border-casino-gray text-casino-white font-semibold rounded-lg hover:bg-casino-gray-dark transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cash Out
              </button>
            </div>

            {lastPayout !== null && (
              <div className="text-right text-sm text-casino-gray-light">
                {brainrotLandmines.lastPayout(lastPayout)}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-3" aria-live="polite">
            {error && (
              <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {gameState === 'hit-mine' && (
              <div className="bg-casino-accent-primary/10 border border-casino-accent-primary rounded-lg px-4 py-3 text-sm text-casino-accent-primary">
                {brainrotLandmines.mineHit()}
              </div>
            )}

            {gameState === 'cashed-out' && lastPayout !== null && (
              <div className="bg-casino-accent-secondary/10 border border-casino-accent-secondary rounded-lg px-4 py-3 text-sm text-casino-accent-secondary">
                {lastMultiplier < 2
                  ? brainrotLandmines.cashoutSmall(lastPayout)
                  : brainrotLandmines.cashoutBig(lastPayout, lastMultiplier)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



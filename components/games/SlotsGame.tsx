'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../UserProvider';
import { brainrotSlots } from '@/copy/brainrot';
import { BetSelector } from './BetSelector';

const BET_OPTIONS = [1_000, 5_000, 10_000, 50_000, 100_000];

// Fixed symbol strip per reel (circular)
const REEL_STRIP = [
  'CHERRY',
  'LEMON',
  'BAR',
  'SEVEN',
  'DIAMOND',
  'LEMON',
  'CHERRY',
  'BAR',
] as const;

type SymbolCode = (typeof REEL_STRIP)[number];

type SpinState = 'idle' | 'spinning' | 'result';
type SpinMode = 'quick' | 'slow';

interface SpinResult {
  reels: SymbolCode[];
  result: 'win' | 'loss' | 'tie';
  betAmount: number;
  grossWinnings: number;
  net: number;
  balance: number;
}

export function SlotsGame({ initialBalance }: { initialBalance: number }) {
  const [selectedBet, setSelectedBet] = useState<number>(50);
  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [spinMode, setSpinMode] = useState<SpinMode>('quick');
  // Current center index for each reel (0..REEL_STRIP.length-1)
  const [reelIndexes, setReelIndexes] = useState<number[]>([0, 2, 4]);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightWin, setHighlightWin] = useState(false);
  const { user, setUser } = useUser();

  // Ensure selectedBet is always valid
  useEffect(() => {
    if (selectedBet < 1 || selectedBet > balance) {
      // Reset to a safe default if invalid
      const safeBet = Math.min(50, Math.max(1, balance));
      if (balance >= 1) {
        setSelectedBet(safeBet);
      }
    }
  }, [balance, selectedBet]);

  const canSpin =
    spinState !== 'spinning' &&
    selectedBet >= 1 &&
    balance >= selectedBet &&
    Number.isFinite(selectedBet);

  const handleSpin = async () => {
    if (!canSpin) return;

    // Validate bet amount before sending
    const bet = Math.floor(Number(selectedBet));
    if (!Number.isFinite(bet) || bet < 1 || bet > balance) {
      setError('Invalid bet amount');
      setSpinState('idle');
      return;
    }

    setError(null);
    setSpinState('spinning');
    setLastResult(null);
    setHighlightWin(false);

    try {
      const response = await fetch('/api/games/slots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: bet }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError((data as { error?: string }).error || 'Spin failed');
        setSpinState('idle');
        return;
      }

      const spinResult = data as SpinResult;

      // Map server symbols to target indexes on our strip (one random index per symbol)
      const targetIndexes: number[] = spinResult.reels.map((symbol) => {
        const matches = REEL_STRIP.map((s, i) => ({ s, i })).filter(
          (entry) => entry.s === symbol
        );
        if (matches.length === 0) {
          // Fallback: any index
          return Math.floor(Math.random() * REEL_STRIP.length);
        }
        const choice = matches[Math.floor(Math.random() * matches.length)];
        return choice.i;
      });

      // Sequential spin with overlapping reels:
      // - all reels spin together
      // - reel 1 stops first, then 2, then 3, while others keep spinning
      const totalSteps = spinMode === 'quick' ? 22 : 46;
      const stopSteps = spinMode === 'quick' ? [6, 12, 18] : [14, 28, 42];
      const baseDelay = spinMode === 'quick' ? 35 : 70;

      await new Promise<void>((resolve) => {
        let step = 0;
        let currentIndexes = [...reelIndexes];

        const tick = () => {
          // If we've completed all steps, ensure all reels are on their targets
          if (step > totalSteps) {
            setReelIndexes(targetIndexes);
            resolve();
            return;
          }

          // Advance any reel that hasn't reached its stop step yet
          currentIndexes = currentIndexes.map((idx, i) => {
            if (step >= stopSteps[i]) {
              // This reel is considered stopped - lock to target
              return targetIndexes[i];
            }
            // Still spinning - move down the strip
            return (idx + 1) % REEL_STRIP.length;
          });

          setReelIndexes(currentIndexes);

          step += 1;

          setTimeout(tick, baseDelay);
        };

        tick();
      });

      setBalance(spinResult.balance);
      if (user) {
        setUser({ ...user, chip_balance: spinResult.balance });
      }
      setLastResult(spinResult);
      setSpinState('result');
      if (spinResult.result === 'win') {
        setHighlightWin(true);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setSpinState('idle');
    }
  };

  // Remove win highlight after a short time to keep motion subtle
  useEffect(() => {
    if (!highlightWin) return;
    const timeout = setTimeout(() => setHighlightWin(false), 2000);
    return () => clearTimeout(timeout);
  }, [highlightWin]);

  const getResultMessage = () => {
    if (!lastResult) return null;
    return brainrotSlots.primaryResult(lastResult);
  };

  // Given a reel center index, compute the three visible symbols (top, center, bottom)
  const getReelWindow = (index: number): {
    top: SymbolCode;
    center: SymbolCode;
    bottom: SymbolCode;
  } => {
    const len = REEL_STRIP.length;
    const center = REEL_STRIP[((index % len) + len) % len];
    const top = REEL_STRIP[((index - 1) % len + len) % len];
    const bottom = REEL_STRIP[((index + 1) % len + len) % len];
    return { top, center, bottom };
  };

  const renderSymbol = (symbol: SymbolCode) => {
    switch (symbol) {
      case 'CHERRY':
        return '🍒';
      case 'LEMON':
        return '🍋';
      case 'BAR':
        return '🏦';
      case 'SEVEN':
        return '7️⃣';
      case 'DIAMOND':
        return '💎';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-display text-casino-white">Slots</h1>
        <div className="text-right">
          <p className="text-sm text-casino-gray-light">Balance</p>
          <p className="text-2xl font-mono text-casino-accent-gold">
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Game area */}
      <div
        className={`bg-casino-black-lighter border rounded-xl p-8 space-y-6 transition-shadow transition-colors duration-300 ${
          highlightWin
            ? 'border-casino-accent-secondary shadow-lg shadow-casino-accent-secondary/40'
            : 'border-casino-gray-darker'
        }`}
      >
        {/* Reels */}
        <div className="grid grid-cols-3 gap-4">
          {reelIndexes.map((idx, reelIdx) => {
            const { top, center, bottom } = getReelWindow(idx);
            return (
            <div
                key={reelIdx}
                className={`aspect-square bg-casino-gray-darker rounded-lg overflow-hidden flex flex-col items-center justify-center text-5xl transition-transform duration-200 ${
                  highlightWin ? 'animate-scale-in ring-2 ring-casino-accent-secondary' : ''
                }`}
              >
                <span className="select-none py-1 opacity-40 text-4xl">
                  {renderSymbol(top)}
                </span>
                <span className="select-none py-1">
                  {renderSymbol(center)}
                </span>
                <span className="select-none py-1 opacity-40 text-4xl">
                  {renderSymbol(bottom)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="space-y-3">
            <BetSelector
              balance={balance}
              selectedBet={selectedBet}
              onBetChange={setSelectedBet}
              presetOptions={BET_OPTIONS}
            />

            <div className="space-y-1">
              <p className="text-sm text-casino-gray-light">Spin Speed</p>
              <div className="flex gap-2 mt-1">
                {(['quick', 'slow'] as SpinMode[]).map((mode) => {
                  const isSelected = spinMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSpinMode(mode)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                        isSelected
                          ? 'bg-casino-accent-primary text-casino-white'
                          : 'bg-casino-gray-darker text-casino-gray-light hover:bg-casino-gray-dark border border-casino-gray'
                      }`}
                    >
                      {mode === 'quick' ? 'Quick' : 'Slow'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-casino-gray-light">
                {brainrotSlots.spinSpeedLabel(spinMode)}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-right md:text-left">
            <button
              type="button"
              onClick={handleSpin}
              disabled={!canSpin}
              className="w-full md:w-auto px-8 py-4 bg-casino-accent-primary text-casino-white font-semibold text-lg rounded-xl hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {spinState === 'spinning' ? 'Spinning…' : 'SPIN'}
            </button>
            {!canSpin && selectedBet > 0 && balance < selectedBet && (
              <p className="text-[11px] text-casino-accent-primary mt-1">
                {brainrotSlots.insufficientBalance()}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3" aria-live="polite">
          {error && (
            <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {lastResult && (
            <>
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  lastResult.result === 'win'
                    ? 'bg-casino-accent-secondary/10 border border-casino-accent-secondary text-casino-accent-secondary'
                    : lastResult.result === 'tie'
                    ? 'bg-casino-gray-darker border border-casino-gray text-casino-gray-light'
                    : 'bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary'
                }`}
              >
                {getResultMessage()}
              </div>
              {lastResult.result === 'win' &&
                brainrotSlots.secondaryWin(lastResult) && (
                  <div className="bg-casino-accent-primary/10 border border-casino-accent-primary rounded-lg px-4 py-3 text-sm text-casino-accent-primary animate-fade-in">
                    {brainrotSlots.secondaryWin(lastResult)!}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}



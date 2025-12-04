'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '../UserProvider';
import { BetSelector } from './BetSelector';
import {
  DEFAULT_CRASH_TIME_SECONDS,
  getMultiplierAtTimeSeconds,
} from '@/lib/games/crash';

type CrashState = 'idle' | 'running' | 'crashed' | 'cashed_out';

interface CrashStartResponse {
  success: boolean;
  roundId: string;
  crashMultiplier: number;
  startedAt: string;
  curveDurationSeconds: number;
  balance: number;
  error?: string;
}

interface CrashCashoutResponse {
  success: boolean;
  crashed: boolean;
  crashMultiplier: number;
  cashoutMultiplier?: number;
  payout?: number;
  balance?: number;
  error?: string;
}

export function CrashGame({ initialBalance }: { initialBalance: number }) {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(initialBalance);
  const [selectedBet, setSelectedBet] = useState<number>(10_000);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [crashState, setCrashState] = useState<CrashState>('idle');
  const [multiplier, setMultiplier] = useState(1);
  const [crashMultiplier, setCrashMultiplier] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCashoutPending, setIsCashoutPending] = useState(false);
  const [graphPoints, setGraphPoints] = useState<{ t: number; value: number }[]>([]);

  const startedAtRef = useRef<Date | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const curveDurationRef = useRef<number>(DEFAULT_CRASH_TIME_SECONDS);
  const lastSampleTimeRef = useRef<number>(0);

  const canStart =
    crashState === 'idle' &&
    selectedBet > 0 &&
    balance >= selectedBet;

  const canCashout = crashState === 'running' && !isCashoutPending;

  // Animate multiplier while running
  useEffect(() => {
    // Keep animating while round is running, and also after cashout so the
    // player can see how high it would have gone, until the crash point.
    const shouldAnimate =
      (crashState === 'running' || crashState === 'cashed_out') &&
      !isCashoutPending;

    if (!shouldAnimate) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const startedAt = startedAtRef.current;
    if (!startedAt) return;

    const duration = curveDurationRef.current || DEFAULT_CRASH_TIME_SECONDS;
    // Use the real crash multiplier from the server so the visual curve
    // never overshoots the actual crash point.
    // As a safety, fall back to a reasonable visual cap if it's missing.
    const targetMultiplier = crashMultiplier ?? 10;

    const tick = () => {
      const now = new Date();
      const elapsedSec = (now.getTime() - startedAt.getTime()) / 1000;
      let current = getMultiplierAtTimeSeconds(
        elapsedSec,
        targetMultiplier,
        duration,
      );
      // If we've visually reached the crash point, snap to it
      // and auto-resolve as crashed.
      if (crashMultiplier != null && current >= crashMultiplier) {
        current = crashMultiplier;
        setMultiplier(current);
        // Add final point at crash
        setGraphPoints((prev) => {
          const next = [...prev, { t: elapsedSec, value: current }];
          return next.slice(-120);
        });
        setCrashState('crashed');
        void autoResolveCrash();
        return;
      }
      setMultiplier(current);
      // Sample points for graph ~10 times per second
      const nowMs = now.getTime();
      if (nowMs - lastSampleTimeRef.current >= 100) {
        lastSampleTimeRef.current = nowMs;
        setGraphPoints((prev) => {
          const next = [...prev, { t: elapsedSec, value: current }];
          // Keep last ~120 samples (~12 seconds at 10 Hz)
          return next.slice(-120);
        });
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [crashState, crashMultiplier, isCashoutPending]);

  // Automatically resolve the round as crashed when we detect crash on client,
  // without waiting for the player to click.
  const autoResolveCrash = async () => {
    if (!roundId || !startedAtRef.current) return;

    try {
      const res = await fetch('/api/games/crash/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      });

      const data = (await res.json()) as CrashCashoutResponse;

      if (!res.ok || !data.success) {
        // If this fails, just mark as crashed locally; bet was already deducted.
        setCrashState('crashed');
        setLastResult('Round crashed.');
        return;
      }

      setCrashMultiplier(data.crashMultiplier);
      if (data.crashed) {
        setCrashState('crashed');
        setLastResult(
          `Crashed at ${data.crashMultiplier.toFixed(2)}× – you lost your bet.`,
        );
      }
      setRoundId(null);
    } catch (err) {
      console.error(err);
      setCrashState('crashed');
      setLastResult('Round crashed.');
    }
  };

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await fetch('/api/games/crash/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: selectedBet }),
      });

      const data = (await res.json()) as CrashStartResponse;

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to start crash round');
        setIsStarting(false);
        return;
      }

      setRoundId(data.roundId);
      setCrashState('running');
      // Store the real crash multiplier so the animation stays in sync
      // with the actual crash point (we don't show the value directly).
      setCrashMultiplier(data.crashMultiplier);
      setMultiplier(1);
      startedAtRef.current = new Date(data.startedAt);
      curveDurationRef.current =
        data.curveDurationSeconds || DEFAULT_CRASH_TIME_SECONDS;
      lastSampleTimeRef.current = 0;
      setGraphPoints([{ t: 0, value: 1 }]);
      setBalance(data.balance);
      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCashout = async () => {
    if (!roundId || !canCashout) return;
    setIsCashoutPending(true);
    setError(null);

    try {
      const res = await fetch('/api/games/crash/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          // Send the client-side elapsed time so server and UI
          // agree on the multiplier at the exact click moment.
          elapsedSeconds: startedAtRef.current
            ? (Date.now() - startedAtRef.current.getTime()) / 1000
            : undefined,
        }),
      });

      const data = (await res.json()) as CrashCashoutResponse;

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to cash out');
        setIsCashoutPending(false);
        return;
      }

      setCrashMultiplier(data.crashMultiplier);

      if (data.crashed) {
        setCrashState('crashed');
        setLastResult(
          `Crashed at ${data.crashMultiplier.toFixed(2)}× – you lost your bet.`,
        );
      } else {
        setCrashState('cashed_out');
        const m = data.cashoutMultiplier ?? 0;
        const payout = data.payout ?? 0;
        setMultiplier(m);
        setLastResult(
          `You cashed out at ${m.toFixed(2)}× for ${payout.toLocaleString()} chips.`,
        );
        if (typeof data.balance === 'number') {
          setBalance(data.balance);
          if (user) {
            setUser({ ...user, chip_balance: data.balance });
          }
        }
      }

      setRoundId(null);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsCashoutPending(false);
    }
  };

  const handleNewRound = () => {
      setCrashState('idle');
      setMultiplier(1);
      setCrashMultiplier(null);
      setRoundId(null);
      setLastResult(null);
      setError(null);
      setGraphPoints([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-casino-white mb-2">
            Crash
          </h1>
          <p className="text-casino-gray-light text-sm max-w-xl">
            Watch the multiplier climb and cash out before it crashes. If you
            wait too long, you lose your bet.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-casino-gray-light uppercase tracking-wide">
            Balance
          </p>
          <p className="text-2xl font-mono text-casino-accent-gold">
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6 items-start">
        {/* Graph + multiplier panel */}
        <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-2xl p-6 flex flex-col gap-6">
          {/* Isolated Graph Area */}
          <div className="w-full h-[400px] bg-casino-black border border-casino-gray-darker rounded-xl p-4">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* X/Y axes */}
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="100"
                stroke="#374151"
                strokeWidth="0.5"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100"
                stroke="#374151"
                strokeWidth="0.5"
              />
              {/* Horizontal grid lines */}
              {[25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={100 - y}
                  x2="100"
                  y2={100 - y}
                  stroke="#1f2937"
                  strokeWidth="0.4"
                  strokeDasharray="2 2"
                />
              ))}
              {/* Crash curve: historical path of multiplier over time */}
              {graphPoints.length > 0 && (() => {
                // Normalize time to always fill full width (0-100%)
                // If round ended (crashed/cashed out), use last point's time
                // Otherwise, use curve duration so line grows from left to right
                const lastPoint = graphPoints[graphPoints.length - 1];
                const firstPoint = graphPoints[0];
                const isRoundOver = crashState === 'crashed' || crashState === 'cashed_out';
                const maxTime = isRoundOver && lastPoint
                  ? Math.max(lastPoint.t, 0.1)  // Use actual end time when round finished
                  : Math.max(curveDurationRef.current || 12, lastPoint?.t || 1); // Use duration while running
                
                // Determine Y-axis scale: use crash multiplier if known, otherwise use max from points
                // Add 20% padding at top for better visibility
                const maxMultiplierFromPoints = Math.max(...graphPoints.map(p => p.value), 1);
                const maxMultiplierForScale = crashMultiplier 
                  ? crashMultiplier * 1.2  // Use crash multiplier + 20% padding
                  : Math.max(maxMultiplierFromPoints * 1.2, 5); // Use current max + 20% padding, min 5x
                
                // Ensure we always start from origin (0, 1.00x)
                const pointsToRender = firstPoint?.t === 0
                  ? graphPoints
                  : [{ t: 0, value: 1 }, ...graphPoints];
                
                return (
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsToRender
                      .map((p) => {
                        // X: time normalized to 0-100 (always fills full width)
                        const x = p.t === 0 ? 0 : Math.min((p.t / maxTime) * 100, 100);
                        // Y: multiplier mapped to 0-100 using dynamic scale
                        // Map from 1.00x (bottom) to maxMultiplierForScale (top)
                        // Formula: y = 100 - ((value - 1) / (max - 1)) * 100
                        const normalizedValue = (p.value - 1) / (maxMultiplierForScale - 1);
                        const y = 100 - Math.min(Math.max(normalizedValue * 100, 0), 100);
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                );
              })()}
            </svg>
          </div>

          {/* Multiplier Display (separate from graph) */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-casino-gray-light">
              Multiplier
            </p>
            <p
              className={`mt-3 font-mono ${
                crashState === 'running'
                  ? 'text-6xl md:text-7xl text-casino-accent-secondary'
                  : crashState === 'crashed'
                  ? 'text-5xl md:text-6xl text-casino-accent-primary'
                  : 'text-5xl md:text-6xl text-casino-accent-gold'
              }`}
            >
              {multiplier.toFixed(2)}×
            </p>
            {crashState === 'crashed' && crashMultiplier != null && (
              <p className="mt-3 text-sm font-semibold text-casino-accent-primary">
                Crashed at {crashMultiplier.toFixed(2)}×
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-casino-accent-primary text-casino-white hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {crashState === 'running'
                ? 'Round in Progress'
                : isStarting
                ? 'Starting...'
                : 'Start Round'}
            </button>
            <button
              type="button"
              onClick={handleCashout}
              disabled={!canCashout}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-casino-accent-secondary text-casino-black hover:bg-green-400 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCashoutPending ? 'Cashing Out...' : 'Cash Out'}
            </button>
          </div>

          {lastResult && (
            <div className="mt-4 w-full">
              <div className="bg-casino-gray-darker/60 border border-casino-gray rounded-lg px-4 py-3 text-sm text-casino-gray-light">
                {lastResult}
              </div>
              {crashState !== 'running' && (
                <button
                  type="button"
                  onClick={handleNewRound}
                  className="mt-3 w-full px-4 py-2 rounded-lg text-xs font-semibold bg-casino-gray-darker text-casino-gray-light hover:bg-casino-gray-dark transition-colors"
                >
                  New Round
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-2xl p-6 space-y-4">
          <BetSelector
            balance={balance}
            selectedBet={selectedBet}
            onBetChange={setSelectedBet}
            showFractionButtons
            label="Bet Amount"
          />

          <div className="mt-4 text-xs text-casino-gray-light space-y-1">
            <p>
              • Your bet is deducted at the start of the round. If you crash,
              you lose the full amount.
            </p>
            <p>
              • If you cash out in time, you receive{' '}
              <span className="font-mono text-casino-accent-secondary">
                bet × multiplier
              </span>{' '}
              back.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}



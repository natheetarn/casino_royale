"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "../UserProvider";
import { RouletteBet } from "@/lib/games/roulette";
import { brainrotRoulette } from "@/copy/brainrot";
import { BetSelector } from "./BetSelector";

const CHIP_OPTIONS = [10, 50, 100, 500, 1000];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Base European roulette wheel order (single zero)
const BASE_WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

// Repeat the sequence to get a long horizontal carousel to scroll through
const CAROUSEL_REPEAT_COUNT = 7;
const CAROUSEL_NUMBERS: number[] = Array.from(
  { length: BASE_WHEEL_NUMBERS.length * CAROUSEL_REPEAT_COUNT },
  (_, i) => BASE_WHEEL_NUMBERS[i % BASE_WHEEL_NUMBERS.length],
);

type SpinState = 'idle' | 'spinning' | 'result';

interface SpinResponse {
  success: boolean;
  winningNumber: number;
  winningColor: 'red' | 'black' | 'green';
  bets: { bet: RouletteBet; payout: number }[];
  totalStake: number;
  totalPayout: number;
  net: number;
  balance: number;
  error?: string;
}

export function RouletteGame({ initialBalance }: { initialBalance: number }) {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(initialBalance);
  const [selectedChip, setSelectedChip] = useState<number>(CHIP_OPTIONS[0]);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [lastSpin, setLastSpin] = useState<SpinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [spinDuration, setSpinDuration] = useState<number>(1.2); // seconds
  const [pendingSpin, setPendingSpin] = useState<SpinResponse | null>(null);
  const [showResultToast, setShowResultToast] = useState(false);

  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalStake = bets.reduce((sum, b) => sum + b.amount, 0);
  const canSpin = spinState !== 'spinning' && bets.length > 0 && totalStake <= balance;

  const centerCarousel = () => {
    const middleIndex = Math.floor(CAROUSEL_NUMBERS.length / 2);
    const container = carouselContainerRef.current;
    const item = carouselItemRefs.current[middleIndex];
    if (container && item) {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const target = itemCenter - container.clientWidth / 2;
      container.scrollLeft = target;
    }
  };

  const scrollToCarouselIndex = (index: number, durationMs: number) => {
    const container = carouselContainerRef.current;
    const item = carouselItemRefs.current[index];
    if (!container || !item || durationMs <= 0) return;

    const startScroll = container.scrollLeft;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const targetScroll = itemCenter - container.clientWidth / 2;
    const distance = targetScroll - startScroll;

    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      container.scrollLeft = startScroll + distance * eased;
      if (t < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    centerCarousel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showResultToast) return;
    const id = setTimeout(() => setShowResultToast(false), 2500);
    return () => clearTimeout(id);
  }, [showResultToast]);

  const addOrIncrementBet = (bet: RouletteBet) => {
    setBets((prev) => {
      // If same type/value exists, increment its amount
      const existingIndex = prev.findIndex(
        (b) => b.type === bet.type && b.value === bet.value,
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          amount: next[existingIndex].amount + bet.amount,
        };
        return next;
      }
      return [...prev, bet];
    });
  };

  const handleNumberClick = (n: number) => {
    if (spinState === 'spinning') return;
    if (selectedChip <= 0) return;
    addOrIncrementBet({ type: 'straight', value: n, amount: selectedChip });
  };

  const handleOutsideClick = (type: RouletteBet['type'], value: any) => {
    if (spinState === 'spinning') return;
    if (selectedChip <= 0) return;
    addOrIncrementBet({ type, value, amount: selectedChip });
  };

  const handleClearBets = () => {
    if (spinState === 'spinning') return;
    setBets([]);
    setLastSpin(null);
    setError(null);
  };

  const handleRemoveBetAt = (index: number) => {
    if (spinState === 'spinning') return;
    setBets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpin = async () => {
    if (!canSpin) return;
    setError(null);
    setWinningIndex(null);
    setSpinState('spinning');
    setLastSpin(null);
    setPendingSpin(null);

    try {
      const res = await fetch('/api/games/roulette/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bets }),
      });

      const data: SpinResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Spin failed');
        setSpinState('idle');
        return;
      }

      // Map winning number to an index in the extended carousel strip.
      // Start from an early repeat, then animate towards a later repeat so it
      // visibly travels across multiple pockets before stopping.
      const baseIndex = BASE_WHEEL_NUMBERS.indexOf(data.winningNumber);
      const safeBaseIndex = baseIndex >= 0 ? baseIndex : 0;
      const startRepeat = 1;
      const targetRepeat = CAROUSEL_REPEAT_COUNT - 2;
      const startIndex = startRepeat * BASE_WHEEL_NUMBERS.length + safeBaseIndex;
      const targetIndex =
        targetRepeat * BASE_WHEEL_NUMBERS.length + safeBaseIndex;

      // Jump near the start of the strip without animation
      const container = carouselContainerRef.current;
      const startItem = carouselItemRefs.current[startIndex];
      if (container && startItem) {
        const itemCenter = startItem.offsetLeft + startItem.offsetWidth / 2;
        const target = itemCenter - container.clientWidth / 2;
        container.scrollLeft = target;
      }

      // Then smoothly scroll a long distance to the target
      setWinningIndex(targetIndex);
      setTimeout(() => {
        scrollToCarouselIndex(targetIndex, spinDuration * 1000);
      }, 30);

      // Defer result display until after animation finishes
      setPendingSpin(data);
      setBalance(data.balance);
      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }
      setBets([]);

      // Result styling & toast are driven after scroll settles
      setTimeout(() => {
        setLastSpin(data);
        setSpinState('result');
        setShowResultToast(true);
      }, spinDuration * 1000 + 120);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setSpinState('idle');
    }
  };

  const renderNumberCell = (n: number) => {
    const isZero = n === 0;
    const isRed = !isZero && RED_NUMBERS.includes(n);
    const isWinning = lastSpin?.winningNumber === n;
    const straightBetAmount = bets
      .filter((b) => b.type === 'straight' && b.value === n)
      .reduce((sum, b) => sum + b.amount, 0);
    const baseColor = isZero
      ? 'bg-green-700 border-green-500'
      : isRed
      ? 'bg-red-700 border-red-500'
      : 'bg-casino-gray-darker border-casino-gray';

    return (
      <button
        key={n}
        type="button"
        onClick={() => handleNumberClick(n)}
        disabled={spinState === 'spinning'}
        className={`relative h-10 flex items-center justify-center rounded-lg text-sm font-mono border ${baseColor} ${
          isWinning ? 'ring-2 ring-casino-accent-gold' : ''
        } hover:brightness-110 transition-all duration-150 disabled:opacity-60`}
      >
        {n}
        {straightBetAmount > 0 && (
          <span className="absolute bottom-0 right-0 mb-0.5 mr-0.5 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
            {straightBetAmount.toLocaleString()}
          </span>
        )}
      </button>
    );
  };

  const renderResultText = () => {
    if (!lastSpin) return null;
    if (lastSpin.net > 0) {
      return brainrotRoulette.resultWin(
        lastSpin.net,
        lastSpin.winningNumber,
        lastSpin.winningColor,
      );
    }
    if (lastSpin.net < 0) {
      return brainrotRoulette.resultLoss(lastSpin.totalStake);
    }
    return brainrotRoulette.resultTie();
  };

  const describeBet = (bet: RouletteBet): string => {
    switch (bet.type) {
      case 'straight':
        return `#${bet.value}`;
      case 'color':
        return bet.value === 'red' ? 'RED' : bet.value === 'black' ? 'BLACK' : String(bet.value);
      case 'odd_even':
        return bet.value === 'odd' ? 'ODD' : 'EVEN';
      case 'low_high':
        return bet.value === 'low' ? '1–18' : '19–36';
      default:
        return String(bet.value);
    }
  };

  return (
    <div className="space-y-8">
      {/* Lightweight result toast */}
      {showResultToast && lastSpin && (
        <div className="pointer-events-none fixed top-20 inset-x-0 z-30 flex justify-center">
          <div
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 shadow-xl shadow-black/60 border text-sm ${
              lastSpin.net > 0
                ? 'bg-casino-accent-secondary/10 border-casino-accent-secondary text-casino-accent-secondary'
                : lastSpin.net < 0
                ? 'bg-casino-accent-primary/10 border-casino-accent-primary text-casino-accent-primary'
                : 'bg-casino-gray-darker/90 border-casino-gray text-casino-gray-light'
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-casino-gray-light">
                  Result
                </span>
                <span className="text-base md:text-lg font-mono">
                  {lastSpin.winningNumber}{' '}
                  <span className="text-xs md:text-sm text-casino-gray-light">
                    ({lastSpin.winningColor.toUpperCase()})
                  </span>
                </span>
              </div>
              <div className="text-xs md:text-sm text-right">
                {lastSpin.net > 0
                  ? brainrotRoulette.resultWin(
                      lastSpin.net,
                      lastSpin.winningNumber,
                      lastSpin.winningColor,
                    )
                  : lastSpin.net < 0
                  ? brainrotRoulette.resultLoss(lastSpin.totalStake)
                  : brainrotRoulette.resultTie()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display text-casino-white">Roulette</h1>
          <p className="text-sm text-casino-gray-light mt-1">
            {brainrotRoulette.helper()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-sm text-casino-gray-light">Balance</p>
            <p className="text-2xl font-mono text-casino-accent-gold">
              {balance.toLocaleString()}
            </p>
          </div>
          {lastSpin && (
            <div className="inline-flex items-baseline gap-2 rounded-lg border border-casino-gray-darker bg-casino-black-lighter/70 px-3 py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-casino-gray-light">
                Result
              </span>
              <span className="text-base md:text-lg font-mono text-casino-accent-gold">
                {lastSpin.winningNumber}{" "}
                <span className="text-xs md:text-sm text-casino-gray-light">
                  ({lastSpin.winningColor.toUpperCase()})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Wheel + table + controls */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <div className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-6 space-y-6 md:space-y-0">
          {/* Left: wheel + table */}
          <div className="space-y-4">
            {/* Wheel carousel */}
            <div className="flex justify-center">
              <div className="relative h-32 w-full max-w-md">
                {/* Fixed pointer */}
                <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center z-20">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-casino-accent-gold drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                    <div className="w-[2px] h-24 rounded-full bg-casino-accent-gold shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                  </div>
                </div>

                {/* Number strip */}
                <div
                  ref={carouselContainerRef}
                  className="absolute inset-0 overflow-hidden z-10"
                >
                  <div className="flex h-full items-stretch gap-[2px] px-6">
                    {CAROUSEL_NUMBERS.map((num, index) => {
                      const isZero = num === 0;
                      const isRed = !isZero && RED_NUMBERS.includes(num);
                      const isWinningSegment =
                        winningIndex === index && spinState === 'result';

                      const backgroundColor = isZero
                        ? '#16a34a'
                        : isRed
                        ? '#b91c1c'
                        : '#020617';

                      return (
                        <div
                          key={`${num}-${index}`}
                          ref={(el) => {
                            carouselItemRefs.current[index] = el;
                          }}
                          className="flex items-center justify-center min-w-[42px] h-full rounded-sm"
                          style={{
                            backgroundColor,
                            color: '#f9fafb',
                            borderLeft: '1px solid rgba(15,23,42,0.8)',
                            borderRight: '1px solid rgba(15,23,42,0.8)',
                            boxShadow: isWinningSegment
                              ? '0 0 14px rgba(250,204,21,0.8)'
                              : 'none',
                            transform: isWinningSegment ? 'scale(1.05)' : 'scale(1)',
                            transition:
                              'transform 0.15s ease-out, box-shadow 0.15s ease-out',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Outside bets strip */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleOutsideClick('color', 'red')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-red-700 border-red-500 text-white hover:brightness-110 transition-all duration-150 disabled:opacity-60 ${
                  lastSpin?.winningColor === 'red'
                    ? 'ring-2 ring-casino-accent-gold'
                    : ''
                }`}
              >
                <span>RED</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'color' && b.value === 'red')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
              <button
                type="button"
                onClick={() => handleOutsideClick('color', 'black')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-black border-casino-gray text-white hover:brightness-125 transition-all duration-150 disabled:opacity-60 ${
                  lastSpin?.winningColor === 'black'
                    ? 'ring-2 ring-casino-accent-gold'
                    : ''
                }`}
              >
                <span>BLACK</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'color' && b.value === 'black')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
              <button
                type="button"
                onClick={() => handleOutsideClick('odd_even', 'odd')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-casino-gray-darker border-casino-gray text-casino-white hover:bg-casino-gray-dark transition-all duration-150 disabled:opacity-60 ${
                  bets.some((b) => b.type === 'odd_even' && b.value === 'odd')
                    ? 'ring-1 ring-casino-accent-gold/60'
                    : ''
                }`}
              >
                <span>ODD</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'odd_even' && b.value === 'odd')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
              <button
                type="button"
                onClick={() => handleOutsideClick('odd_even', 'even')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-casino-gray-darker border-casino-gray text-casino-white hover:bg-casino-gray-dark transition-all duration-150 disabled:opacity-60 ${
                  bets.some((b) => b.type === 'odd_even' && b.value === 'even')
                    ? 'ring-1 ring-casino-accent-gold/60'
                    : ''
                }`}
              >
                <span>EVEN</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'odd_even' && b.value === 'even')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
              <button
                type="button"
                onClick={() => handleOutsideClick('low_high', 'low')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-casino-gray-darker border-casino-gray text-casino-white hover:bg-casino-gray-dark transition-all duration-150 disabled:opacity-60 ${
                  bets.some((b) => b.type === 'low_high' && b.value === 'low')
                    ? 'ring-1 ring-casino-accent-gold/60'
                    : ''
                }`}
              >
                <span>1–18</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'low_high' && b.value === 'low')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
              <button
                type="button"
                onClick={() => handleOutsideClick('low_high', 'high')}
                disabled={spinState === 'spinning'}
                className={`relative px-4 py-2 rounded-lg text-sm font-mono border bg-casino-gray-darker border-casino-gray text-casino-white hover:bg-casino-gray-dark transition-all duration-150 disabled:opacity-60 ${
                  bets.some((b) => b.type === 'low_high' && b.value === 'high')
                    ? 'ring-1 ring-casino-accent-gold/60'
                    : ''
                }`}
              >
                <span>19–36</span>
                <span className="block text-[10px] font-mono opacity-80">
                  1:1
                </span>
                {(() => {
                  const total = bets
                    .filter((b) => b.type === 'low_high' && b.value === 'high')
                    .reduce((sum, b) => sum + b.amount, 0);
                  if (!total) return null;
                  return (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-casino-black/80 text-[10px] font-mono text-casino-accent-gold border border-casino-gray">
                      {total.toLocaleString()}
                    </span>
                  );
                })()}
              </button>
            </div>

            {/* Number grid */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 37 }, (_, i) => i).map(renderNumberCell)}
            </div>
          </div>

          {/* Right: chips + current bets + actions */}
          <div className="space-y-4">
            {/* Chip selector */}
            <BetSelector
              balance={balance}
              selectedBet={selectedChip}
              onBetChange={setSelectedChip}
              presetOptions={CHIP_OPTIONS}
              showFractionButtons={true}
              showLabel={true}
              label="Chips"
            />

            {/* Current bets list */}
            <div className="space-y-2">
              <p className="text-sm text-casino-gray-light">Current Bets</p>
              {bets.length === 0 ? (
                <p className="text-xs text-casino-gray-light">
                  No bets yet – tap numbers or outside areas to place chips.
                </p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {bets.map((bet, index) => (
                    <div
                      key={`${bet.type}-${bet.value}-${index}`}
                      className="flex items-center justify-between text-xs bg-casino-gray-darker rounded-lg px-2 py-1 border border-casino-gray"
                    >
                      <span className="font-mono text-casino-white">
                        {describeBet(bet)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-casino-accent-gold">
                          {bet.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBetAt(index)}
                          className="text-casino-gray-light hover:text-casino-white transition-colors"
                          aria-label="Remove bet"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals, spin speed & actions */}
            <div className="flex flex-col items-end gap-3 w-full">
              <div className="flex flex-col items-end gap-1 w-full">
                <div className="text-sm text-casino-gray-light">
                  Total stake:{' '}
                  <span className="font-mono text-casino-white">
                    {totalStake.toLocaleString()}
                  </span>{' '}
                  chips
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between text-[11px] text-casino-gray-light mb-1">
                    <span>Spin duration</span>
                    <span className="font-mono text-casino-gray-light">
                      {spinDuration.toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={spinDuration}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isNaN(v)) return;
                      setSpinDuration(Math.min(3, Math.max(0.5, v)));
                    }}
                    className="w-full accent-casino-accent-primary"
                    disabled={spinState === 'spinning'}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearBets}
                  disabled={spinState === 'spinning' || bets.length === 0}
                  className="px-4 py-2 bg-casino-black border border-casino-gray text-casino-gray-light rounded-lg hover:bg-casino-gray-darker transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  Clear Bets
                </button>
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  className="px-6 py-2 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  {spinState === 'spinning' ? 'Spinning…' : 'Spin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages & last spin */}
      <div className="space-y-3" aria-live="polite">
        {error && (
          <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {lastSpin && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              lastSpin.net > 0
                ? 'bg-casino-accent-secondary/10 border border-casino-accent-secondary text-casino-accent-secondary'
                : lastSpin.net < 0
                ? 'bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary'
                : 'bg-casino-gray-darker border border-casino-gray text-casino-gray-light'
            }`}
          >
            {renderResultText()}
          </div>
        )}
      </div>
    </div>
  );
}



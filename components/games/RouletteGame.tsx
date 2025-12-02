"use client";

import { useState } from "react";
import Wheel from "react-roulette-pro";
import type { PrizeType } from "react-roulette-pro";
import "react-roulette-pro/dist/index.css";
import { useUser } from "../UserProvider";
import { RouletteBet } from "@/lib/games/roulette";
import { brainrotRoulette } from "@/copy/brainrot";

const CHIP_OPTIONS = [10, 50, 100, 500, 1000];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Base European roulette wheel order (single zero)
const BASE_WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

// Repeat the wheel multiple times so the strip has enough length to spin
const WHEEL_REPEAT_COUNT = 5;
const EXTENDED_WHEEL_NUMBERS = Array.from(
  { length: BASE_WHEEL_NUMBERS.length * WHEEL_REPEAT_COUNT },
  (_, i) => BASE_WHEEL_NUMBERS[i % BASE_WHEEL_NUMBERS.length],
);

const WHEEL_DATA = EXTENDED_WHEEL_NUMBERS.map((num, index) => {
  return {
    id: `${num}-${index}`,
    image: "",
    text: String(num),
  };
});

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
  const [customChipInput, setCustomChipInput] = useState<string>(
    String(CHIP_OPTIONS[0]),
  );
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [lastSpin, setLastSpin] = useState<SpinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);

  const totalStake = bets.reduce((sum, b) => sum + b.amount, 0);
  const canSpin = spinState !== 'spinning' && bets.length > 0 && totalStake <= balance;

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
    setPrizeIndex(null);
    setSpinState('spinning');
    setLastSpin(null);

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

      // Map winning number to a prize index in the *extended* wheel strip.
      // We stop around the middle repeat so the wheel has room to scroll in.
      const baseIndex = BASE_WHEEL_NUMBERS.indexOf(data.winningNumber);
      const safeBaseIndex = baseIndex >= 0 ? baseIndex : 0;
      const middleRepeat = Math.floor(WHEEL_REPEAT_COUNT / 2);
      const prizeIdx = middleRepeat * BASE_WHEEL_NUMBERS.length + safeBaseIndex;
      setPrizeIndex(prizeIdx);

      setLastSpin(data);
      setBalance(data.balance);
      if (user) {
        setUser({ ...user, chip_balance: data.balance });
      }
      setBets([]);
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

  const renderWheelPocket = (prize: PrizeType) => {
    const numeric = Number(prize.text ?? prize.id);
    const isZero = numeric === 0;
    const isRed = !isZero && RED_NUMBERS.includes(numeric);

    const backgroundColor = isZero
      ? "#16a34a" // green-600
      : isRed
      ? "#b91c1c" // red-700
      : "#020617"; // slate-950

    return (
      <div
        style={{
          backgroundColor,
          color: "#f9fafb",
          paddingInline: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          fontSize: "11px",
          fontFamily: "monospace",
          borderLeft: "1px solid rgba(15,23,42,0.8)",
          borderRight: "1px solid rgba(15,23,42,0.8)",
        }}
      >
        {prize.text}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-casino-white">Roulette</h1>
          <p className="text-sm text-casino-gray-light mt-1">
            {brainrotRoulette.helper()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-casino-gray-light">Balance</p>
          <p className="text-2xl font-mono text-casino-accent-gold">
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Wheel + table + controls */}
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6">
        <div className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-6 space-y-6 md:space-y-0">
          {/* Left: wheel + table */}
          <div className="space-y-4">
            {/* Wheel */}
            <div className="flex justify-center">
              <div className="relative h-64 w-full max-w-md flex items-center justify-center overflow-hidden">
                <Wheel
                  start={prizeIndex !== null}
                  prizeIndex={prizeIndex ?? 0}
                  prizes={WHEEL_DATA}
                  spinningTime={3.5}
                  transitionFunction="ease-out"
                  onPrizeDefined={() => {
                    setSpinState("result");
                  }}
                  prizeItemRenderFunction={renderWheelPocket}
                  defaultDesignOptions={{
                    prizesWithText: false,
                    hideCenterDelimiter: false,
                  }}
                  options={{
                    stopInCenter: true,
                  }}
                />
                {/* Fixed pointer overlay */}
                <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2">
                  <div className="h-4 w-4 rotate-180">
                    <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-casino-accent-gold drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
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
                {bets.some((b) => b.type === 'color' && b.value === 'red') && (
                  <span className="absolute top-0 right-0 mt-0.5 mr-0.5 h-1.5 w-1.5 rounded-full bg-casino-accent-gold" />
                )}
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
                {bets.some((b) => b.type === 'color' && b.value === 'black') && (
                  <span className="absolute top-0 right-0 mt-0.5 mr-0.5 h-1.5 w-1.5 rounded-full bg-casino-accent-gold" />
                )}
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
            <div className="space-y-2">
              <p className="text-sm text-casino-gray-light">Chips</p>
              <div className="flex flex-wrap gap-2">
                {CHIP_OPTIONS.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setSelectedChip(chip);
                        setCustomChipInput(String(chip));
                      }}
                      className={`px-4 py-2 rounded-full font-mono text-sm transition-colors duration-150 ${
                        isSelected
                          ? 'bg-casino-accent-primary text-casino-white'
                          : 'bg-casino-gray-darker text-casino-white border border-casino-gray hover:bg-casino-gray-dark'
                      }`}
                    >
                      {chip.toLocaleString()}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <label
                  htmlFor="rouletteCustomChip"
                  className="text-xs text-casino-gray-light"
                >
                  Custom
                </label>
                <input
                  id="rouletteCustomChip"
                  type="number"
                  min={1}
                  step={1}
                  value={customChipInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomChipInput(value);
                    const numeric = parseInt(value, 10);
                    if (Number.isNaN(numeric) || numeric <= 0) {
                      setSelectedChip(0);
                      return;
                    }
                    setSelectedChip(numeric);
                  }}
                  className="w-24 px-3 py-2 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white font-mono text-xs placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
                  placeholder="Amount"
                />
              </div>
            </div>

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

            {/* Totals & actions */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-casino-gray-light">
                Total stake:{' '}
                <span className="font-mono text-casino-white">
                  {totalStake.toLocaleString()}
                </span>{' '}
                chips
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



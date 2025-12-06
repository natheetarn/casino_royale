'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '../UserProvider';
import { BetSelector } from './BetSelector';

export function CrashGame({ initialBalance }: { initialBalance: number }) {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(initialBalance);
  const [selectedBet, setSelectedBet] = useState<number>(10_000);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashed, setCrashed] = useState(false);
  const [running, setRunning] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [crashPoint, setCrashPoint] = useState(0);
  const [graphData, setGraphData] = useState<{x: number, y: number}[]>([]);

  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const graphContainerRef = useRef(null);

  const generateCrashPoint = () => {
    if (Math.random() < 0.03) return 1.00
    const e = 2 ** 32
    const h = crypto.getRandomValues(new Uint32Array(1))[0]
    return Math.floor((100 * e - h) / (e - h)) / 100
  }

  const canStart = !running && selectedBet > 0 && balance >= selectedBet;
  const canCashout = running && !crashed && !cashedOutAt;

  const startGame = () => {
    if (selectedBet > balance) return;

    const newBalance = balance - selectedBet;
    setBalance(newBalance);
    if (user) {
      setUser({ ...user, chip_balance: newBalance });
    }

    setRunning(true);
    setCrashed(false);
    setCashedOutAt(null);
    setMultiplier(1.00);
    setGraphData([{ x: 0, y: 1 }]);
    setCrashPoint(generateCrashPoint());

    startTimeRef.current = Date.now();
    requestRef.current = requestAnimationFrame(animate);
  }

  const animate = () => {
    const now = Date.now()
    if (!startTimeRef.current) return;
    const timeElapsed = (now - startTimeRef.current) / 1000

    const currentMultiplier = Math.exp(0.15 * timeElapsed)

    setMultiplier(currentMultiplier)
    setGraphData(prev => [...prev, { x: timeElapsed, y: currentMultiplier }])

    if (currentMultiplier >= crashPoint) {
      crash(crashPoint)
    } else {
      requestRef.current = requestAnimationFrame(animate)
    }
  }

  const crash = (finalValue: number) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
    setMultiplier(finalValue)
    setCrashed(true)
    setRunning(false)
  }

  const cashOut = () => {
    if (!running || crashed || cashedOutAt) return

    const winAmount = selectedBet * multiplier
    setCashedOutAt(multiplier)
    const newBalance = balance + winAmount
    setBalance(newBalance)
    if (user) {
      setUser({ ...user, chip_balance: newBalance });
    }
  }

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  // Calculate SVG path
  const getPath = () => {
    if (graphData.length === 0) return ""

    const maxX = graphData[graphData.length - 1].x
    const maxY = Math.max(2, graphData[graphData.length - 1].y) // Minimum scale Y is 2

    const width = 800 // SVG internal width
    const height = 300 // SVG internal height
    const padding = 20

    const points = graphData.map(p => {
      const x = (p.x / Math.max(1, maxX)) * (width - padding * 2) + padding
      const y = height - ((p.y - 1) / (maxY - 1)) * (height - padding * 2) - padding
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  const handleNewRound = () => {
    setRunning(false);
    setCrashed(false);
    setCashedOutAt(null);
    setMultiplier(1.00);
    setCrashPoint(0);
    setGraphData([]);
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
          {/* Graph Area */}
          <div
            className="relative w-full h-[300px] bg-casino-black border border-casino-gray-darker rounded-xl overflow-hidden"
          >
            <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="280" x2="800" y2="280" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="20" y1="0" x2="20" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

              {/* The Graph Line */}
              <path
                d={getPath()}
                fill="none"
                stroke={crashed ? '#f43f5e' : '#22c55e'}
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
              />

              {/* Fill area under graph */}
              {(() => {
                const path = getPath();
                if (!path) return null;
                const lastPoint = path.split(' ').pop()?.split(',')[0];
                return lastPoint ? (
                  <path
                    d={`${path} L ${lastPoint},300 L 20,300 Z`}
                    fill={crashed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                    stroke="none"
                  />
                ) : null;
              })()}
            </svg>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl md:text-7xl font-bold font-mono">
              <span
                style={{
                  color: crashed ? '#f43f5e' : (cashedOutAt ? '#22c55e' : 'white'),
                  textShadow: crashed ? '0 0 30px rgba(244, 63, 94, 0.6)' : '0 0 20px rgba(255, 255, 255, 0.2)',
                }}
              >
                {multiplier.toFixed(2)}x
              </span>
            </div>

            {crashed && (
              <div className="absolute top-[70%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-xl">
                CRASHED
              </div>
            )}

            {cashedOutAt && (
              <div className="absolute top-[70%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-lg">
                Cashed out at {cashedOutAt.toFixed(2)}x (+{selectedBet * cashedOutAt - selectedBet})
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {!running ? (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-casino-accent-primary text-casino-white hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Place Bet
              </button>
            ) : (
              <button
                onClick={cashOut}
                disabled={!canCashout}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-casino-accent-gold text-casino-black hover:bg-yellow-400 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cashedOutAt ? 'Cashed Out' : 'CASH OUT'}
              </button>
            )}
            {crashed && (
              <button
                onClick={handleNewRound}
                className="px-4 py-3 rounded-lg font-semibold bg-casino-gray-darker text-casino-gray-light hover:bg-casino-gray-dark transition-colors"
              >
                New Round
              </button>
            )}
          </div>
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
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';

interface BetSelectorProps {
  balance: number;
  selectedBet: number;
  onBetChange: (bet: number) => void;
  presetOptions?: number[];
  showCustom?: boolean;
  showFractionButtons?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function BetSelector({
  balance,
  selectedBet,
  onBetChange,
  presetOptions = [10, 50, 100, 500, 1000],
  showCustom = true,
  showFractionButtons = true,
  showLabel = true,
  label = 'Bet Amount',
  className = '',
}: BetSelectorProps) {
  const [customBetInput, setCustomBetInput] = useState<string>(
    String(selectedBet || ''),
  );

  // Sync custom input when selectedBet changes externally
  useEffect(() => {
    if (selectedBet > 0 && !presetOptions.includes(selectedBet)) {
      setCustomBetInput(String(selectedBet));
    }
  }, [selectedBet, presetOptions]);

  const handleFractionBet = (fraction: number) => {
    const bet = Math.max(1, Math.floor(balance * fraction)); // Ensure at least 1
    if (bet > 0 && bet <= balance) {
      onBetChange(bet);
      setCustomBetInput(String(bet));
    }
  };

  const handlePresetBet = (amount: number) => {
    const bet = Math.max(1, Math.min(amount, balance)); // Ensure at least 1
    if (bet > 0 && bet <= balance) {
      onBetChange(bet);
      setCustomBetInput(String(bet));
    }
  };

  const handleCustomInputChange = (value: string) => {
    setCustomBetInput(value);
    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric) || numeric <= 0) {
      onBetChange(0);
      return;
    }
    const bet = Math.max(1, Math.min(numeric, balance)); // Ensure at least 1, cap at balance
    onBetChange(bet);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        {showLabel && (
          <p className="text-sm text-casino-gray-light mb-2">{label}</p>
        )}
        
        {/* Fraction Buttons */}
        {showFractionButtons && (
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleFractionBet(0.1)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-150 ${
                Math.abs(selectedBet - Math.floor(balance * 0.1)) < 1
                  ? 'bg-casino-accent-primary text-casino-white'
                  : 'bg-casino-gray-darker text-casino-white hover:bg-casino-gray-dark border border-casino-gray'
              }`}
            >
              1/10
            </button>
            <button
              type="button"
              onClick={() => handleFractionBet(0.25)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-150 ${
                Math.abs(selectedBet - Math.floor(balance * 0.25)) < 1
                  ? 'bg-casino-accent-primary text-casino-white'
                  : 'bg-casino-gray-darker text-casino-white hover:bg-casino-gray-dark border border-casino-gray'
              }`}
            >
              1/4
            </button>
            <button
              type="button"
              onClick={() => handleFractionBet(0.5)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-150 ${
                Math.abs(selectedBet - Math.floor(balance * 0.5)) < 1
                  ? 'bg-casino-accent-primary text-casino-white'
                  : 'bg-casino-gray-darker text-casino-white hover:bg-casino-gray-dark border border-casino-gray'
              }`}
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => handleFractionBet(1)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-150 ${
                selectedBet === balance
                  ? 'bg-casino-accent-primary text-casino-white'
                  : 'bg-casino-gray-darker text-casino-white hover:bg-casino-gray-dark border border-casino-gray'
              }`}
            >
              All In
            </button>
          </div>
        )}

        {/* Preset Options */}
        <div className="flex flex-wrap gap-2">
          {presetOptions.map((amount) => {
            const bet = Math.min(amount, balance);
            const isSelected = selectedBet === bet;
            const isDisabled = bet <= 0 || bet > balance;

            return (
              <button
                key={amount}
                type="button"
                onClick={() => handlePresetBet(amount)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-150 ${
                  isSelected
                    ? 'bg-casino-accent-primary text-casino-white'
                    : isDisabled
                    ? 'bg-casino-gray-darker text-casino-gray-light opacity-50 cursor-not-allowed'
                    : 'bg-casino-gray-darker text-casino-white hover:bg-casino-gray-dark border border-casino-gray'
                }`}
              >
                {amount.toLocaleString()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Input */}
      {showCustom && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="customBet"
            className="text-xs text-casino-gray-light whitespace-nowrap"
          >
            Custom
          </label>
          <input
            id="customBet"
            type="number"
            min={1}
            max={balance}
            step={1}
            value={customBetInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            className="w-28 px-3 py-2 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white font-mono text-sm placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            placeholder="Amount"
          />
          <span className="text-xs text-casino-gray-light whitespace-nowrap">
            Max {balance.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}


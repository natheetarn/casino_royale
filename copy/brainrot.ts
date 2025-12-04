// Centralized game copy helpers.
// Contains straightforward copy with occasional inside jokes.

type SlotsOutcome = {
  result: 'win' | 'loss' | 'tie';
  betAmount: number;
  grossWinnings: number;
  net: number;
};

export const brainrotSlots = {
  primaryResult(outcome: SlotsOutcome): string {
    if (outcome.result === 'win') {
      const amount = outcome.grossWinnings.toLocaleString();
      return `You won ${amount} chips!`;
    }

    if (outcome.result === 'tie') {
      return 'Tie! Your bet has been returned.';
    }

    const lost = outcome.betAmount.toLocaleString();
    return `You lost ${lost} chips.`;
  },

  secondaryWin(outcome: SlotsOutcome): string | null {
    if (outcome.result !== 'win') return null;
    const net = outcome.net.toLocaleString();
    return `Net change: +${net} chips`;
  },

  spinSpeedLabel(mode: 'quick' | 'slow'): string {
    if (mode === 'quick') {
      return 'Quick';
    }
    return 'Slow';
  },

  insufficientBalance(): string {
    // Inside joke: Thai door reference
    return 'ทาง🏛️🤔อะไรอยู่ครับ ถึง🔐🚪ตรงนี้ ทำให้ผม🔝🚋เที่ยวสุดท้าย🚫ทันเลย (Insufficient balance)';
  },
};

// Landmines-specific copy
export const brainrotLandmines = {
  subtitle(): string {
    return 'Reveal safe tiles, cash out before you hit a mine. 💣';
  },

  gridSizeHelper(): { left: string; right: string } {
    return {
      left: 'Small',
      right: 'Large',
    };
  },

  minesHelper(): { left: string; right: string } {
    return {
      left: 'Few',
      right: 'Many',
    };
  },

  safeRevealed(count: number): string {
    if (count === 0) {
      return 'No safe tiles revealed yet.';
    }
    if (count === 1) {
      return '1 safe tile revealed.';
    }
    return `${count} safe tiles revealed.`;
  },

  mineHit(): string {
    // Inside joke: Thai expression
    return 'ไอ้ส๊าาาาาสสส 💥 Mine hit! Game over.';
  },

  cashoutSmall(payout: number): string {
    const amount = payout.toLocaleString();
    // Inside joke: "You can sit anywhere, EXCEPT THE ABSOLUTE MIDDLE"
    return `You can sit anywhere, EXCEPT THE ABSOLUTE MIDDLE 😶‍🌫️ Cashed out for ${amount} chips.`;
  },

  cashoutBig(payout: number, multiplier: number): string {
    const amount = payout.toLocaleString();
    return `Cashed out: ${amount} chips at ${multiplier.toFixed(2)}× multiplier.`;
  },

  lastPayout(payout: number): string {
    const amount = payout.toLocaleString();
    return `Last cash out: ${amount} chips`;
  },
};

// Roulette-specific copy
export const brainrotRoulette = {
  helper(): string {
    return 'Place your bets and spin the wheel.';
  },

  resultWin(amount: number, number: number, color: string): string {
    const amt = amount.toLocaleString();
    const colorLabel =
      color === 'red' ? 'Red 🔴' : color === 'black' ? 'Black ⚫️' : 'Green 🟢';
    return `You hit ${number} ${colorLabel}! +${amt} chips`;
  },

  resultLoss(totalStake: number): string {
    const loss = totalStake.toLocaleString();
    return `You lost ${loss} chips.`;
  },

  resultTie(): string {
    return 'Tie! You broke even.';
  },
};




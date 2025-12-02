// Centralized brainrot / Gen Z copy helpers.
// All phrases are sourced from `2025-brainrot-gambling-catchphrases.md`
// and a few project-specific inside jokes the team provided.

type SlotsOutcome = {
  result: 'win' | 'loss' | 'tie';
  betAmount: number;
  grossWinnings: number;
  net: number;
};

export const brainrotSlots = {
  primaryResult(outcome: SlotsOutcome): string {
    if (outcome.result === 'win') {
      // Win lines, adapted from "GYATT DAMN!", "No cap", "Main character energy"
      const amount = outcome.grossWinnings.toLocaleString();
      return `GYATT DAMN! You just won ${amount} chips 🔥`;
    }

    if (outcome.result === 'tie') {
      return 'Six seven vibes… bet returned. Mid but we move.';
    }

    const lost = outcome.betAmount.toLocaleString();
    return `Speedrunning broke any% – you just lost ${lost} chips 💥`;
  },

  secondaryWin(outcome: SlotsOutcome): string | null {
    if (outcome.result !== 'win') return null;
    const net = outcome.net.toLocaleString();
    return `Main character energy! Net change: +${net} chips 💸`;
  },

  spinSpeedLabel(mode: 'quick' | 'slow'): string {
    if (mode === 'quick') {
      // Quick = panic spins
      return 'Quick – panic spins, no thoughts 🧠❌';
    }
    return 'Slow – skibidi cinematic suffering 🎬';
  },

  insufficientBalance(): string {
    // Thai door joke reimagined as an insufficent-balance line
    return 'ทาง🏛️🤔อะไรอยู่ครับ ถึง🔐🚪ตรงนี้ ทำให้ผม🔝🚋เที่ยวสุดท้าย🚫ทันเลย (balance too low to spin)';
  },
};

// Landmines-specific brainrot copy
export const brainrotLandmines = {
  subtitle(): string {
    return 'Reveal safe tiles, cash out before you hit a mine. No NPC pathing allowed. 💣';
  },

  gridSizeHelper(): { left: string; right: string } {
    return {
      left: 'Grandma mode 👵',
      right: 'Ohio-level chaos 🌪️',
    };
  },

  minesHelper(): { left: string; right: string } {
    return {
      left: 'Safe ✅',
      right: 'Speedrun bankruptcy 💣',
    };
  },

  safeRevealed(count: number): string {
    if (count === 0) {
      return 'No safe tiles yet – lock in. 😶‍🌫️';
    }
    if (count === 1) {
      return 'First tile W. Your aura is low-key based. ✨';
    }
    return `Safe tiles: ${count}. You’re cooking, don’t crash out now. 👨‍🍳`;
  },

  mineHit(): string {
    // Project inside joke + brainrot
    return 'ไอ้ส๊าาาาาสสส 💥 Mine hit. Crashout arc unlocked.';
  },

  cashoutSmall(payout: number): string {
    const amount = payout.toLocaleString();
    return `You can sit anywhere, EXCEPT THE ABSOLUTE MIDDLE 😶‍🌫️ Cashed out for ${amount} chips. Safe, but timid.`;
  },

  cashoutBig(payout: number, multiplier: number): string {
    const amount = payout.toLocaleString();
    return `Main character cashout: ${amount} chips at ${multiplier.toFixed(
      2,
    )}×. Sigma grindset approved. 💸`;
  },

  lastPayout(payout: number): string {
    const amount = payout.toLocaleString();
    return `Last cash out: ${amount} chips – aura upgraded. 🌟`;
  },
};

// Roulette-specific brainrot copy
export const brainrotRoulette = {
  helper(): string {
    return '67 reasons to spin the wheel 🎡 (reason 1: vibes, reason 2: chips)';
  },

  resultWin(amount: number, number: number, color: string): string {
    const amt = amount.toLocaleString();
    const colorLabel =
      color === 'red' ? 'Red 🔴' : color === 'black' ? 'Black ⚫️' : 'Green 🟢';
    return `GYATT DAMN, you hit ${number} ${colorLabel}! +${amt} chips 🔥`;
  },

  resultLoss(totalStake: number): string {
    const loss = totalStake.toLocaleString();
    return `Only in Ohio would you feed the wheel ${loss} chips like that 😭`;
  },

  resultTie(): string {
    return 'Six seven outcome – you basically broke even. Mid but valid.';
  },
};




export type RouletteBetType =
  | 'straight'
  | 'color'
  | 'odd_even'
  | 'low_high';

export type RouletteColor = 'red' | 'black' | 'green';

export interface RouletteBet {
  type: RouletteBetType;
  value: number | RouletteColor | 'odd' | 'even' | 'low' | 'high';
  amount: number;
}

export interface RouletteEvalResult {
  winningNumber: number;
  winningColor: RouletteColor;
  totalStake: number;
  totalPayout: number;
  net: number;
  betResults: {
    bet: RouletteBet;
    payout: number;
  }[];
}

// Standard European roulette red/black mapping
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9,
  12, 14, 16, 18,
  19, 21, 23, 25, 27,
  30, 32, 34, 36,
]);

export function getRouletteColor(n: number): RouletteColor {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

export function randomWinningNumber(): number {
  // 0–36 inclusive
  return Math.floor(Math.random() * 37);
}

export function evaluateBet(
  bet: RouletteBet,
  winningNumber: number,
  winningColor: RouletteColor,
): number {
  const amount = bet.amount;

  switch (bet.type) {
    case 'straight': {
      if (typeof bet.value !== 'number') return 0;
      return bet.value === winningNumber ? amount * 35 : 0;
    }
    case 'color': {
      if (bet.value !== 'red' && bet.value !== 'black') return 0;
      if (winningNumber === 0) return 0;
      return bet.value === winningColor ? amount * 2 : 0;
    }
    case 'odd_even': {
      if (bet.value !== 'odd' && bet.value !== 'even') return 0;
      if (winningNumber === 0) return 0;
      const isOdd = winningNumber % 2 === 1;
      const betOdd = bet.value === 'odd';
      return isOdd === betOdd ? amount * 2 : 0;
    }
    case 'low_high': {
      if (bet.value !== 'low' && bet.value !== 'high') return 0;
      if (winningNumber === 0) return 0;
      const isLow = winningNumber >= 1 && winningNumber <= 18;
      const betLow = bet.value === 'low';
      return isLow === betLow ? amount * 2 : 0;
    }
    default:
      return 0;
  }
}

export function evaluateBets(
  bets: RouletteBet[],
  winningNumber: number,
): RouletteEvalResult {
  const winningColor = getRouletteColor(winningNumber);
  let totalStake = 0;
  let totalPayout = 0;

  const betResults = bets.map((bet) => {
    totalStake += bet.amount;
    const payout = evaluateBet(bet, winningNumber, winningColor);
    totalPayout += payout;
    return { bet, payout };
  });

  return {
    winningNumber,
    winningColor,
    totalStake,
    totalPayout,
    net: totalPayout - totalStake,
    betResults,
  };
}



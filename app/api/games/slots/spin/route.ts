import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

const MIN_BET = 1;
const MAX_BET = 1_000_000;

const SYMBOLS = ['CHERRY', 'LEMON', 'BAR', 'SEVEN', 'DIAMOND'] as const;
type SymbolType = (typeof SYMBOLS)[number];

function getRandomSymbol(): SymbolType {
  // Simple weighted odds: more common low symbols
  const pool: SymbolType[] = [
    'CHERRY', 'CHERRY', 'CHERRY', 'CHERRY',
    'LEMON', 'LEMON', 'LEMON',
    'BAR', 'BAR',
    'SEVEN',
    'DIAMOND',
  ];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function calculatePayout(bet: number, reels: SymbolType[]) {
  const [a, b, c] = reels;
  const isTriple = a === b && b === c;
  const isDouble = a === b || a === c || b === c;

  let multiplier = 0;
  let result: 'win' | 'loss' | 'tie' = 'loss';

  if (isTriple) {
    switch (a) {
      case 'DIAMOND':
        multiplier = 20;
        break;
      case 'SEVEN':
        multiplier = 10;
        break;
      case 'BAR':
        multiplier = 6;
        break;
      case 'CHERRY':
        multiplier = 4;
        break;
      case 'LEMON':
        multiplier = 3;
        break;
    }
  } else if (isDouble) {
    switch (a === b ? a : c) {
      case 'DIAMOND':
      case 'SEVEN':
        multiplier = 3;
        break;
      case 'BAR':
        multiplier = 2;
        break;
      case 'CHERRY':
      case 'LEMON':
        multiplier = 1.5;
        break;
    }
  }

  const grossWinnings = Math.floor(bet * multiplier);
  const net = grossWinnings - bet; // we always subtract bet

  if (net > 0) {
    result = 'win';
  } else if (net === 0) {
    result = 'tie';
  } else {
    result = 'loss';
  }

  return { grossWinnings, net, result };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { betAmount } = await request.json();

    const bet = Number(betAmount);
    if (!Number.isFinite(bet) || bet < MIN_BET || bet > MAX_BET) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get latest user balance from DB
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, chip_balance')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.chip_balance < bet) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Generate reels and calculate payout
    const reels: SymbolType[] = [
      getRandomSymbol(),
      getRandomSymbol(),
      getRandomSymbol(),
    ];

    const { grossWinnings, net, result } = calculatePayout(bet, reels);

    const newBalance = currentUser.chip_balance + net;

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ chip_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Record transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'slots',
      amount: net,
      balance_after: newBalance,
      reason: 'Slots spin',
    });

    if (txError) {
      // Not critical, but log on server
      console.error('Slots transaction error:', txError);
    }

    // Record game history
    const { error: historyError } = await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: 'slots',
      bet_amount: bet,
      result,
      winnings: net,
    });

    if (historyError) {
      console.error('Slots history error:', historyError);
    }

    return NextResponse.json({
      success: true,
      reels,
      result,
      betAmount: bet,
      grossWinnings,
      net,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Slots spin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



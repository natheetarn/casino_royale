import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import { createApiTimer } from '@/lib/logging';

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
  const timer = createApiTimer({
    path: request.nextUrl.pathname,
    method: request.method,
  });

  let userId: string | undefined;

  try {
    const user = await getSession();
    userId = user?.id;

    if (!user) {
      timer(401, { reason: 'unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { betAmount } = await request.json();

    const bet = Number(betAmount);
    if (!Number.isFinite(bet) || bet < MIN_BET || bet > MAX_BET) {
      timer(400, { reason: 'invalid_bet_amount', bet });
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get latest user balance from DB
    const balanceStart = Date.now();
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, chip_balance')
      .eq('id', user.id)
      .single();
    console.log(
      JSON.stringify({
        type: 'db_timing',
        op: 'slots_fetch_user',
        durationMs: Date.now() - balanceStart,
        userId,
      }),
    );

    if (userError || !currentUser) {
      timer(404, { reason: 'user_not_found', userId });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.chip_balance < bet) {
      timer(400, { reason: 'insufficient_balance', userId, bet, balance: currentUser.chip_balance });
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
    const updateStart = Date.now();
    const { error: updateError } = await supabase
      .from('users')
      .update({ chip_balance: newBalance })
      .eq('id', user.id);
    console.log(
      JSON.stringify({
        type: 'db_timing',
        op: 'slots_update_balance',
        durationMs: Date.now() - updateStart,
        userId,
      }),
    );

    if (updateError) {
      timer(500, { reason: 'update_balance_failed', userId, error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Record transaction (non‑critical)
    try {
      const txStart = Date.now();
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        game_type: 'slots',
        amount: net,
        balance_after: newBalance,
        reason: 'Slots spin',
      });
      console.log(
        JSON.stringify({
          type: 'db_timing',
          op: 'slots_insert_transaction',
          durationMs: Date.now() - txStart,
          userId,
          hasError: !!txError,
        }),
      );
      if (txError) {
        console.error('Slots transaction error:', txError);
      }
    } catch (e) {
      console.error('Slots transaction exception:', e);
    }

    // Record game history (non‑critical)
    try {
      const historyStart = Date.now();
      const { error: historyError } = await supabase.from('game_history').insert({
        user_id: user.id,
        game_type: 'slots',
        bet_amount: bet,
        result,
        winnings: net,
      });
      console.log(
        JSON.stringify({
          type: 'db_timing',
          op: 'slots_insert_history',
          durationMs: Date.now() - historyStart,
          userId,
          hasError: !!historyError,
        }),
      );
      if (historyError) {
        console.error('Slots history error:', historyError);
      }
    } catch (e) {
      console.error('Slots history exception:', e);
    }

    timer(200, {
      userId,
      bet,
      net,
      result,
    });

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
    timer(500, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



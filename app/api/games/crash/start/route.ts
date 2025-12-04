import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import {
  DEFAULT_CRASH_TIME_SECONDS,
  generateCrashMultiplier,
} from '@/lib/games/crash';

const MIN_BET = 1;
const MAX_BET = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const betAmount = Number(body.betAmount);

    if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Fetch latest balance
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, chip_balance')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    if (currentUser.chip_balance < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 },
      );
    }

    const crashMultiplier = generateCrashMultiplier();
    const startedAt = new Date();

    // Deduct bet and create crash round in a single flow
    const newBalance = currentUser.chip_balance - betAmount;

    const { error: balanceError } = await supabase
      .from('users')
      .update({ chip_balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 },
      );
    }

    const { data: round, error: roundError } = await supabase
      .from('crash_rounds')
      .insert({
        user_id: user.id,
        bet_amount: betAmount,
        crash_multiplier: crashMultiplier,
        started_at: startedAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (roundError || !round) {
      return NextResponse.json(
        { error: 'Failed to create crash round' },
        { status: 500 },
      );
    }

    // Log transaction for the bet (non‑critical)
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'crash',
      amount: -betAmount,
      balance_after: newBalance,
      reason: 'Crash bet',
    });

    if (txError) {
      console.error('Crash bet transaction error:', txError);
    }

    return NextResponse.json({
      success: true,
      roundId: round.id,
      // We now send crashMultiplier so the client animation can stay in sync
      // with the real outcome and never visually overshoot it.
      crashMultiplier,
      startedAt: startedAt.toISOString(),
      curveDurationSeconds: DEFAULT_CRASH_TIME_SECONDS,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Crash start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



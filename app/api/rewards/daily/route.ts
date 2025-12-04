import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

const DAILY_BONUS = 100_000;
const DAILY_SECONDS = 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, chip_balance, last_daily_bonus_at')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const now = new Date();
    let canClaim = false;
    let secondsRemaining = 0;

    if (!currentUser.last_daily_bonus_at) {
      canClaim = true;
    } else {
      const last = new Date(currentUser.last_daily_bonus_at);
      const elapsed = (now.getTime() - last.getTime()) / 1000;
      if (elapsed >= DAILY_SECONDS) {
        canClaim = true;
      } else {
        secondsRemaining = Math.max(0, Math.floor(DAILY_SECONDS - elapsed));
      }
    }

    if (!canClaim) {
      return NextResponse.json(
        {
          success: false,
          claimed: false,
          secondsRemaining,
          message: 'Daily bonus already claimed. Please come back later.',
        },
        { status: 200 },
      );
    }

    const newBalance = currentUser.chip_balance + DAILY_BONUS;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        chip_balance: newBalance,
        last_daily_bonus_at: now.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 },
      );
    }

    // Log transaction (non‑critical)
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'daily_bonus',
      amount: DAILY_BONUS,
      balance_after: newBalance,
      reason: 'Daily chips bonus',
    });

    if (txError) {
      console.error('Daily bonus transaction error:', txError);
    }

    // Log game history (optional)
    const { error: historyError } = await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: 'daily_bonus',
      bet_amount: 0,
      result: 'win',
      winnings: DAILY_BONUS,
    });

    if (historyError) {
      console.error('Daily bonus history error:', historyError);
    }

    return NextResponse.json({
      success: true,
      claimed: true,
      amount: DAILY_BONUS,
      balance: newBalance,
      claimedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Daily bonus error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



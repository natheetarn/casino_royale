import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import {
  DEFAULT_CRASH_TIME_SECONDS,
  getMultiplierAtTimeSeconds,
} from '@/lib/games/crash';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const roundId = String(body.roundId || '');
    const clientElapsedSecondsRaw = body.elapsedSeconds;

    if (!roundId) {
      return NextResponse.json(
        { error: 'Invalid round id' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: round, error: roundError } = await supabase
      .from('crash_rounds')
      .select('*')
      .eq('id', roundId)
      .eq('user_id', user.id)
      .single();

    if (roundError || !round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 },
      );
    }

    if (!round.is_active) {
      return NextResponse.json(
        { error: 'Round already finished' },
        { status: 400 },
      );
    }

    const startedAt = new Date(round.started_at);
    const now = new Date();
    const serverElapsedSeconds =
      (now.getTime() - startedAt.getTime()) / 1000;

    // Prefer the client-reported elapsed time (moment of click)
    // so the shown multiplier matches what the player saw, but
    // clamp it to be non-negative and not wildly ahead of server time.
    let elapsedSeconds = serverElapsedSeconds;
    const clientElapsed = Number(clientElapsedSecondsRaw);
    if (Number.isFinite(clientElapsed) && clientElapsed >= 0) {
      elapsedSeconds = Math.min(clientElapsed, serverElapsedSeconds + 0.25);
    }

    const crashMultiplier = Number(round.crash_multiplier);
    const serverMultiplier = getMultiplierAtTimeSeconds(
      elapsedSeconds,
      crashMultiplier,
      DEFAULT_CRASH_TIME_SECONDS,
    );

    // If the curve has already reached or exceeded the crash multiplier,
    // the round is considered crashed and the player loses the bet.
    if (serverMultiplier >= crashMultiplier) {
      const { error: updateError } = await supabase
        .from('crash_rounds')
        .update({ is_active: false })
        .eq('id', roundId);

      if (updateError) {
        console.error('Crash round update error on crash:', updateError);
      }

      // Record game history (loss). Bet was already deducted at start.
      const { error: historyError } = await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: 'crash',
          bet_amount: round.bet_amount,
          result: 'loss',
          winnings: -round.bet_amount,
        });

      if (historyError) {
        console.error('Crash history error on crash:', historyError);
      }

      return NextResponse.json({
        success: true,
        crashed: true,
        crashMultiplier,
        finalMultiplier: crashMultiplier,
      });
    }

    // Player successfully cashes out before crash.
    const supabaseUser = await supabase
      .from('users')
      .select('chip_balance')
      .eq('id', user.id)
      .single();

    if (supabaseUser.error || !supabaseUser.data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const currentBalance = supabaseUser.data.chip_balance as number;
    const rawPayout = Math.floor(round.bet_amount * serverMultiplier);
    const netWinnings = rawPayout; // bet already deducted at start
    const newBalance = currentBalance + netWinnings;

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

    const { error: roundUpdateError } = await supabase
      .from('crash_rounds')
      .update({
        is_active: false,
        cashed_out_at: serverMultiplier,
      })
      .eq('id', roundId);

    if (roundUpdateError) {
      console.error('Crash round update error on cashout:', roundUpdateError);
    }

    // Log transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'crash',
      amount: netWinnings,
      balance_after: newBalance,
      reason: 'Crash cashout',
    });

    if (txError) {
      console.error('Crash transaction error on cashout:', txError);
    }

    // Game history
    const { error: historyError } = await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: 'crash',
      bet_amount: round.bet_amount,
      result: 'win',
      winnings: netWinnings,
    });

    if (historyError) {
      console.error('Crash history error on cashout:', historyError);
    }

    return NextResponse.json({
      success: true,
      crashed: false,
      cashoutMultiplier: serverMultiplier,
      crashMultiplier,
      payout: rawPayout,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Crash cashout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



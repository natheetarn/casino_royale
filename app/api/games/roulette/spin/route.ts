import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import {
  evaluateBets,
  randomWinningNumber,
  RouletteBet,
} from '@/lib/games/roulette';

const MIN_BET = 1;
const MAX_BET = 1_000_000;
const MAX_BETS_PER_SPIN = 32;

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const bets = (body.bets || []) as RouletteBet[];

    if (!Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json(
        { error: 'At least one bet is required' },
        { status: 400 },
      );
    }

    if (bets.length > MAX_BETS_PER_SPIN) {
      return NextResponse.json(
        { error: 'Too many bets for a single spin' },
        { status: 400 },
      );
    }

    // Validate bet structure and amounts
    let totalStake = 0;
    for (const bet of bets) {
      if (
        !bet ||
        !bet.type ||
        bet.amount === undefined ||
        typeof bet.amount !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Invalid bet format' },
          { status: 400 },
        );
      }

      if (!['straight', 'color', 'odd_even', 'low_high'].includes(bet.type)) {
        return NextResponse.json(
          { error: 'Unsupported bet type' },
          { status: 400 },
        );
      }

      if (!Number.isFinite(bet.amount) || bet.amount < MIN_BET) {
        return NextResponse.json(
          { error: 'Bet amount too small' },
          { status: 400 },
        );
      }

      if (bet.amount > MAX_BET) {
        return NextResponse.json(
          { error: 'Bet amount too large' },
          { status: 400 },
        );
      }

      // Basic value validation
      if (bet.type === 'straight') {
        if (typeof bet.value !== 'number' || bet.value < 0 || bet.value > 36) {
          return NextResponse.json(
            { error: 'Invalid straight bet value' },
            { status: 400 },
          );
        }
      }

      if (bet.type === 'color') {
        if (bet.value !== 'red' && bet.value !== 'black') {
          return NextResponse.json(
            { error: 'Invalid color bet value' },
            { status: 400 },
          );
        }
      }

      if (bet.type === 'odd_even') {
        if (bet.value !== 'odd' && bet.value !== 'even') {
          return NextResponse.json(
            { error: 'Invalid odd/even bet value' },
            { status: 400 },
          );
        }
      }

      if (bet.type === 'low_high') {
        if (bet.value !== 'low' && bet.value !== 'high') {
          return NextResponse.json(
            { error: 'Invalid low/high bet value' },
            { status: 400 },
          );
        }
      }

      totalStake += bet.amount;
    }

    const supabase = createServerClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, chip_balance')
      .eq('id', sessionUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    if (user.chip_balance < totalStake) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 },
      );
    }

    // Deduct stake
    const balanceAfterStake = user.chip_balance - totalStake;
    const { error: stakeError } = await supabase
      .from('users')
      .update({ chip_balance: balanceAfterStake })
      .eq('id', user.id);

    if (stakeError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 },
      );
    }

    // Determine outcome
    const winningNumber = randomWinningNumber();
    const evalResult = evaluateBets(bets, winningNumber);
    const finalBalance = balanceAfterStake + evalResult.totalPayout;

    // Update final balance
    const { error: finalBalanceError } = await supabase
      .from('users')
      .update({ chip_balance: finalBalance })
      .eq('id', user.id);

    if (finalBalanceError) {
      return NextResponse.json(
        { error: 'Failed to update final balance' },
        { status: 500 },
      );
    }

    // Record transaction (net = payout - stake)
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'roulette',
      amount: evalResult.net,
      balance_after: finalBalance,
      reason: 'Roulette spin',
    });

    if (txError) {
      console.error('Roulette transaction error:', txError);
    }

    // Record game history
    const resultLabel =
      evalResult.net > 0 ? 'win' : evalResult.net < 0 ? 'loss' : 'tie';

    const { error: historyError } = await supabase
      .from('game_history')
      .insert({
        user_id: user.id,
        game_type: 'roulette',
        bet_amount: evalResult.totalStake,
        result: resultLabel,
        winnings: evalResult.net,
      });

    if (historyError) {
      console.error('Roulette history error:', historyError);
    }

    return NextResponse.json({
      success: true,
      winningNumber: evalResult.winningNumber,
      winningColor: evalResult.winningColor,
      bets: evalResult.betResults,
      totalStake: evalResult.totalStake,
      totalPayout: evalResult.totalPayout,
      net: evalResult.net,
      balance: finalBalance,
    });
  } catch (error) {
    console.error('Roulette spin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



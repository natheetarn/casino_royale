import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';
import { calculateMultiplier } from '../reveal/route'; // reuse multiplier logic

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = String(body.sessionId || '');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: session, error: sessionError } = await supabase
      .from('landmines_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: 'Game is already finished' },
        { status: 400 }
      );
    }

    const gridSize: number = session.grid_size;
    const multiplier = calculateMultiplier(
      session.safe_revealed,
      session.mine_count,
      gridSize
    );

    const rawPayout = Math.floor(session.bet_amount * multiplier);
    const netWinnings = rawPayout; // bet was already deducted at start

    // Update user balance
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

    const newBalance = currentUser.chip_balance + netWinnings;

    const { error: balanceError } = await supabase
      .from('users')
      .update({ chip_balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Mark session inactive
    const { error: sessionUpdateError } = await supabase
      .from('landmines_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      console.error('Failed to update landmines session on cashout', sessionUpdateError);
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'landmines',
      amount: netWinnings,
      balance_after: newBalance,
      reason: 'Landmines cash out',
    });

    // Record game history
    await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: 'landmines',
      bet_amount: session.bet_amount,
      result: 'win',
      winnings: netWinnings,
    });

    return NextResponse.json({
      success: true,
      payout: rawPayout,
      netWinnings,
      balance: newBalance,
      multiplier,
      safeRevealed: session.safe_revealed,
    });
  } catch (error) {
    console.error('Landmines cashout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



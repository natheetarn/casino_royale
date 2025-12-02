import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

const DEFAULT_GRID_SIZE = 5;
const DEFAULT_MINE_COUNT = 5;

const MIN_BET = 1;
const MAX_BET = 1000000;

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const betAmount = Number(body.betAmount);
    const gridSize = Number(body.gridSize) || DEFAULT_GRID_SIZE;
    const mineCount = Number(body.mineCount) || DEFAULT_MINE_COUNT;

    if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    if (gridSize < 3 || gridSize > 8) {
      return NextResponse.json(
        { error: 'Invalid grid size' },
        { status: 400 }
      );
    }

    const maxMines = gridSize * gridSize - 1;
    if (mineCount < 1 || mineCount >= maxMines) {
      return NextResponse.json(
        { error: 'Invalid mine count' },
        { status: 400 }
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
        { status: 404 }
      );
    }

    if (currentUser.chip_balance < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Deduct bet upfront
    const newBalance = currentUser.chip_balance - betAmount;

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

    // Record transaction for bet
    await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'landmines',
      amount: -betAmount,
      balance_after: newBalance,
      reason: 'Landmines bet',
    });

    // Create mines layout
    const totalCells = gridSize * gridSize;
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const mines = indices.slice(0, mineCount);
    const minesLayout = JSON.stringify(mines);

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('landmines_sessions')
      .insert({
        user_id: user.id,
        bet_amount: betAmount,
        grid_size: gridSize,
        mine_count: mineCount,
        safe_revealed: 0,
        is_active: true,
        mines_layout: minesLayout,
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Failed to create game session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        gridSize,
        mineCount,
        safeRevealed: 0,
        isActive: true,
      },
      balance: newBalance,
    });
  } catch (error) {
    console.error('Landmines start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



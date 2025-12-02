import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

export function calculateMultiplier(
  safeRevealed: number,
  mineCount: number,
  gridSize: number
): number {
  // Risk‑weighted, strongly increasing multiplier:
  // - Grows faster the more mines there are (higher risk)
  // - Grows sharply as you clear more safe tiles (deep runs feel very rewarding)
  const totalCells = gridSize * gridSize;
  const maxSafe = totalCells - mineCount;

  if (safeRevealed <= 0 || mineCount <= 0 || maxSafe <= 0) {
    return 1;
  }

  // Approximate a "fair" Mines multiplier by compounding risk per reveal,
  // then shave a little for house edge so it doesn't explode too hard.
  let multiplier = 1;
  const houseEdge = 0.96; // 4% edge overall

  for (let i = 0; i < safeRevealed && i < maxSafe; i += 1) {
    const remainingCells = totalCells - i;
    const failProb = mineCount / remainingCells; // chance to hit a mine
    const surviveProb = 1 - failProb;
    if (surviveProb <= 0) break;

    const stepFair = 1 / surviveProb;
    multiplier *= stepFair * houseEdge;
  }

  // Clamp and round slightly for nicer UI
  if (!Number.isFinite(multiplier) || multiplier < 1) {
    return 1;
  }

  // Avoid ridiculous extremes, but still allow juicy late-game payouts
  const clamped = Math.min(multiplier, 50);
  return Number(clamped.toFixed(2));
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = String(body.sessionId || '');
    const cellIndex = Number(body.cellIndex);

    if (!sessionId || !Number.isInteger(cellIndex) || cellIndex < 0) {
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
    const totalCells = gridSize * gridSize;
    if (cellIndex >= totalCells) {
      return NextResponse.json(
        { error: 'Invalid cell index' },
        { status: 400 }
      );
    }

    const mines: number[] = JSON.parse(session.mines_layout || '[]');
    const isMine = mines.includes(cellIndex);

    if (isMine) {
      // End game, user already paid the bet on start
      const { error: updateError } = await supabase
        .from('landmines_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to update landmines session on mine hit', updateError);
      }

      // Record game history
      await supabase.from('game_history').insert({
        user_id: user.id,
        game_type: 'landmines',
        bet_amount: session.bet_amount,
        result: 'loss',
        winnings: -session.bet_amount,
      });

      return NextResponse.json({
        success: true,
        hitMine: true,
        cellIndex,
        multiplier: 0,
        safeRevealed: session.safe_revealed,
      });
    }

    const newSafeRevealed = session.safe_revealed + 1;
    const multiplier = calculateMultiplier(
      newSafeRevealed,
      session.mine_count,
      gridSize
    );

    const { error: updateError } = await supabase
      .from('landmines_sessions')
      .update({ safe_revealed: newSafeRevealed })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update game session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hitMine: false,
      cellIndex,
      safeRevealed: newSafeRevealed,
      multiplier,
    });
  } catch (error) {
    console.error('Landmines reveal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/leaderboard/biggest-wins - Get biggest wins leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'all'; // 'all', 'daily', 'weekly', 'monthly'

    const supabase = createServerClient();

    let query = supabase
      .from('game_history')
      .select(`
        winnings,
        game_type,
        timestamp,
        user_id,
        users!inner(
          username
        )
      `)
      .eq('result', 'win')
      .order('winnings', { ascending: false })
      .limit(limit);

    // Apply date filtering for periods
    const now = new Date();
    if (period === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte('timestamp', today.toISOString());
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('timestamp', weekAgo.toISOString());
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte('timestamp', monthAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Biggest wins fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch biggest wins' },
        { status: 500 }
      );
    }

    // Format the response
    const biggestWins = data.map((win, index) => ({
      rank: index + 1,
      winnings: win.winnings,
      game_type: win.game_type,
      timestamp: win.timestamp,
      user_id: win.user_id,
      users: win.users
    }));

    return NextResponse.json({ biggestWins });

  } catch (error) {
    console.error('Biggest wins API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/daily-challenges/leaderboard - Get challenge leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServerClient();

    let query;

    if (challengeId) {
      // Get leaderboard for specific challenge
      query = supabase
        .from('challenge_entries')
        .select(`
          final_balance,
          entries_count,
          completed_at,
          user_id,
          users!inner(
            username,
            created_at
          )
        `)
        .eq('challenge_id', challengeId)
        .order('final_balance', { ascending: false })
        .limit(limit);
    } else {
      // Get today's challenge leaderboard
      const today = new Date().toISOString().split('T')[0];

      // First get today's challenge
      const { data: todayChallenge, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('id')
        .eq('date', today)
        .single();

      if (challengeError || !todayChallenge) {
        return NextResponse.json({
          leaderboard: [],
          message: 'No active challenge found'
        });
      }

      // Get entries for today's challenge
      query = supabase
        .from('challenge_entries')
        .select(`
          final_balance,
          entries_count,
          completed_at,
          user_id,
          users!inner(
            username,
            created_at
          )
        `)
        .eq('challenge_id', todayChallenge.id)
        .order('final_balance', { ascending: false })
        .limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Challenge leaderboard fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch challenge leaderboard' },
        { status: 500 }
      );
    }

    // Add rank to each entry
    const leaderboardWithRank = (data || []).map((entry, index) => ({
      rank: index + 1,
      final_balance: entry.final_balance,
      entries_count: entry.entries_count,
      completed_at: entry.completed_at,
      user_id: entry.user_id,
      users: entry.users,
      profit: entry.final_balance - 10000 // Assuming 10k starting balance
    }));

    return NextResponse.json({
      leaderboard: leaderboardWithRank,
      totalParticipants: data?.length || 0
    });

  } catch (error) {
    console.error('Challenge leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/leaderboard - Get the current leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'balance'; // 'balance', 'winnings', 'games'

    const supabase = createServerClient();

    let query;

    if (type === 'balance') {
      // Get from cached leaderboard table for performance
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          rank,
          balance,
          user_id,
          users!inner(
            username,
            created_at
          )
        `)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Leaderboard fetch error:', error);
        // Fallback to direct query if leaderboard table is empty
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('id, username, chip_balance, created_at')
          .order('chip_balance', { ascending: false })
          .limit(limit);

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
          );
        }

        const leaderboardWithRank = fallbackData.map((user, index) => ({
          rank: index + 1,
          balance: user.chip_balance,
          user_id: user.id,
          users: {
            username: user.username,
            created_at: user.created_at
          }
        }));

        return NextResponse.json({ leaderboard: leaderboardWithRank });
      }

      return NextResponse.json({ leaderboard: data });
    }
    else if (type === 'winnings') {
      // Get by total winnings from user_stats
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          total_winnings,
          user_id,
          users!inner(
            username,
            chip_balance,
            created_at
          )
        `)
        .order('total_winnings', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Winnings leaderboard fetch error:', error);
        // Fallback to calculating from game_history if user_stats fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('game_history')
          .select('user_id, winnings')
          .eq('result', 'win');

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Failed to fetch winnings leaderboard' },
            { status: 500 }
          );
        }

        // Aggregate winnings by user
        const userWinnings = fallbackData.reduce((acc, game) => {
          if (!acc[game.user_id]) {
            acc[game.user_id] = 0;
          }
          acc[game.user_id] += game.winnings;
          return acc;
        }, {} as Record<string, number>);

        // Get user details for users with winnings
        const userIds = Object.keys(userWinnings);
        if (userIds.length === 0) {
          return NextResponse.json({ leaderboard: [] });
        }

        const { data: userDetails, error: userError } = await supabase
          .from('users')
          .select('id, username, chip_balance, created_at')
          .in('id', userIds)
          .order('chip_balance', { ascending: false })
          .limit(limit);

        if (userError) {
          return NextResponse.json(
            { error: 'Failed to fetch winnings leaderboard' },
            { status: 500 }
          );
        }

        const leaderboardWithRank = userDetails
          .map(user => ({
            rank: 0, // Will be calculated below
            total_winnings: userWinnings[user.id] || 0,
            user_id: user.id,
            users: {
              username: user.username,
              chip_balance: user.chip_balance,
              created_at: user.created_at
            }
          }))
          .sort((a, b) => b.total_winnings - a.total_winnings)
          .slice(0, limit)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));

        return NextResponse.json({ leaderboard: leaderboardWithRank });
      }

      // If user_stats has no data, return empty array
      if (!data || data.length === 0) {
        return NextResponse.json({ leaderboard: [] });
      }

      const leaderboardWithRank = data.map((stat, index) => ({
        rank: index + 1,
        total_winnings: stat.total_winnings,
        user_id: stat.user_id,
        users: stat.users
      }));

      return NextResponse.json({ leaderboard: leaderboardWithRank });
    }
    else if (type === 'games') {
      // Get by games played from user_stats
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          games_played,
          user_id,
          users!inner(
            username,
            chip_balance,
            created_at
          )
        `)
        .order('games_played', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Games leaderboard fetch error:', error);
        // Fallback to calculating from game_history if user_stats fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('game_history')
          .select('user_id');

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Failed to fetch games leaderboard' },
            { status: 500 }
          );
        }

        // Count games by user
        const userGames = fallbackData.reduce((acc, game) => {
          if (!acc[game.user_id]) {
            acc[game.user_id] = 0;
          }
          acc[game.user_id] += 1;
          return acc;
        }, {} as Record<string, number>);

        // Get user details for users who have played games
        const userIds = Object.keys(userGames);
        if (userIds.length === 0) {
          return NextResponse.json({ leaderboard: [] });
        }

        const { data: userDetails, error: userError } = await supabase
          .from('users')
          .select('id, username, chip_balance, created_at')
          .in('id', userIds)
          .order('chip_balance', { ascending: false })
          .limit(limit);

        if (userError) {
          return NextResponse.json(
            { error: 'Failed to fetch games leaderboard' },
            { status: 500 }
          );
        }

        const leaderboardWithRank = userDetails
          .map(user => ({
            rank: 0, // Will be calculated below
            games_played: userGames[user.id] || 0,
            user_id: user.id,
            users: {
              username: user.username,
              chip_balance: user.chip_balance,
              created_at: user.created_at
            }
          }))
          .sort((a, b) => b.games_played - a.games_played)
          .slice(0, limit)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));

        return NextResponse.json({ leaderboard: leaderboardWithRank });
      }

      // If user_stats has no data, return empty array
      if (!data || data.length === 0) {
        return NextResponse.json({ leaderboard: [] });
      }

      const leaderboardWithRank = data.map((stat, index) => ({
        rank: index + 1,
        games_played: stat.games_played,
        user_id: stat.user_id,
        users: stat.users
      }));

      return NextResponse.json({ leaderboard: leaderboardWithRank });
    }

    return NextResponse.json(
      { error: 'Invalid leaderboard type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard - Refresh the leaderboard (admin only)
export async function POST() {
  try {
    const supabase = createServerClient();

    // Call the refresh_leaderboard function
    const { data, error } = await supabase.rpc('refresh_leaderboard');

    if (error) {
      console.error('Leaderboard refresh error:', error);
      return NextResponse.json(
        { error: 'Failed to refresh leaderboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: data
    });

  } catch (error) {
    console.error('Leaderboard refresh API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
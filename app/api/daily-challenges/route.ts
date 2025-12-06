import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// GET /api/daily-challenges - Get current and recent daily challenges
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '7');

    const supabase = createServerClient();

    // Get current challenge
    const today = new Date().toISOString().split('T')[0];

    const { data: currentChallenge, error: currentError } = await supabase
      .from('daily_challenges')
      .select(`
        *,
        challenge_entries(count)
      `)
      .eq('date', today)
      .single();

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('Current challenge fetch error:', currentError);
    }

    let challenges = [currentChallenge].filter(Boolean);

    if (includeHistory) {
      // Get recent challenges
      const { data: history, error: historyError } = await supabase
        .from('daily_challenges')
        .select(`
          *,
          challenge_entries(count),
          challenge_winners(
            rank,
            prize_awarded,
            users!inner(
              username
            )
          )
        `)
        .neq('date', today)
        .order('date', { ascending: false })
        .limit(limit);

      if (historyError) {
        console.error('Challenge history fetch error:', historyError);
      } else {
        challenges = [...challenges, ...history];
      }
    }

    // If no current challenge exists, create one
    if (!currentChallenge) {
      const gameTypes = ['slots', 'landmines', 'crash', 'roulette'];
      const randomGameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];

      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999);

      const { data: newChallenge, error: createError } = await supabase
        .from('daily_challenges')
        .insert({
          date: today,
          game_type: randomGameType,
          starting_balance: 10000,
          end_time: endTime.toISOString(),
          prize_pool: 50000,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Challenge creation error:', createError);
      } else {
        challenges[0] = { ...newChallenge, challenge_entries: [] };
      }
    }

    // Get user's current entry if authenticated
    const user = await getSession();
    let userEntry = null;

    if (user && currentChallenge) {
      const { data: entry, error: entryError } = await supabase
        .from('challenge_entries')
        .select('*')
        .eq('challenge_id', currentChallenge.id)
        .eq('user_id', user.id)
        .single();

      if (!entryError && entry) {
        userEntry = entry;
      }
    }

    return NextResponse.json({
      currentChallenge: challenges[0] || null,
      history: includeHistory ? challenges.slice(1) : [],
      userEntry
    });

  } catch (error) {
    console.error('Daily challenges API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/daily-challenges - Join or update a daily challenge entry
export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { challengeId, action, data } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check if challenge is still active
    if (new Date(challenge.end_time) < new Date()) {
      return NextResponse.json(
        { error: 'Challenge has ended' },
        { status: 400 }
      );
    }

    if (action === 'join') {
      // Check if user already has an entry
      const { data: existingEntry, error: checkError } = await supabase
        .from('challenge_entries')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (!checkError && existingEntry) {
        return NextResponse.json({
          success: true,
          entry: existingEntry,
          message: 'Already joined this challenge'
        });
      }

      // Create new entry
      const { data: newEntry, error: insertError } = await supabase
        .from('challenge_entries')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          final_balance: challenge.starting_balance,
          entries_count: 1
        })
        .select()
        .single();

      if (insertError) {
        console.error('Challenge entry creation error:', insertError);
        return NextResponse.json(
          { error: 'Failed to join challenge' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        entry: newEntry,
        startingBalance: challenge.starting_balance
      });

    } else if (action === 'update_balance') {
      // Update the user's challenge balance (this would be called after game results)
      const { newBalance } = data;

      if (typeof newBalance !== 'number' || newBalance < 0) {
        return NextResponse.json(
          { error: 'Invalid balance' },
          { status: 400 }
        );
      }

      const { data: updatedEntry, error: updateError } = await supabase
        .from('challenge_entries')
        .update({
          final_balance: newBalance,
          completed_at: newBalance <= 0 ? new Date().toISOString() : null
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Challenge entry update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update challenge balance' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        entry: updatedEntry
      });

    } else if (action === 'restart') {
      // Get current entry to increment entries count
      const { data: currentEntry, error: fetchError } = await supabase
        .from('challenge_entries')
        .select('entries_count')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Challenge entry not found' },
          { status: 404 }
        );
      }

      // Reset challenge balance and increment entries count
      const { data: restartedEntry, error: restartError } = await supabase
        .from('challenge_entries')
        .update({
          final_balance: challenge.starting_balance,
          entries_count: currentEntry.entries_count + 1,
          completed_at: null
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (restartError) {
        console.error('Challenge restart error:', restartError);
        return NextResponse.json(
          { error: 'Failed to restart challenge' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        entry: restartedEntry,
        startingBalance: challenge.starting_balance
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Daily challenges POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
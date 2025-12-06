import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// GET /api/achievements - Get user achievements
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get current session if no specific userId provided
    const user = userId ? { id: userId } : await getSession();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (achievementsError) {
      console.error('Achievements fetch error:', achievementsError);
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Get user stats for potential achievements
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // Ignore "not found" errors
      console.error('Stats fetch error:', statsError);
    }

    return NextResponse.json({
      achievements: achievements || [],
      stats: stats || null
    });

  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/achievements - Unlock a new achievement
export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { achievement_type, achievement_data } = await request.json();

    if (!achievement_type) {
      return NextResponse.json(
        { error: 'Achievement type is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if achievement already exists
    const { data: existing, error: checkError } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_type', achievement_type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Achievement check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing achievement' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Achievement already unlocked' },
        { status: 409 }
      );
    }

    // Create new achievement
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        achievement_type,
        achievement_data: achievement_data || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Achievement creation error:', error);
      return NextResponse.json(
        { error: 'Failed to unlock achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      achievement: data
    });

  } catch (error) {
    console.error('Achievement creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
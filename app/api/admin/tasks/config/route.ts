import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data: taskConfigs, error } = await supabase
      .from('task_config')
      .select('*')
      .order('task_type');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch task configurations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configs: taskConfigs || [],
    });
  } catch (error) {
    console.error('Admin task config GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskType, rewardAmount, cooldownSeconds } = body;

    if (!taskType || !['math', 'trivia', 'captcha', 'typing', 'waiting'].includes(taskType)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    if (typeof rewardAmount !== 'number' || rewardAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid reward amount' },
        { status: 400 }
      );
    }

    if (typeof cooldownSeconds !== 'number' || cooldownSeconds < 0) {
      return NextResponse.json(
        { error: 'Invalid cooldown seconds' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('task_config')
      .update({
        reward_amount: rewardAmount,
        cooldown_seconds: cooldownSeconds,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('task_type', taskType)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update task configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: data,
    });
  } catch (error) {
    console.error('Admin task config PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


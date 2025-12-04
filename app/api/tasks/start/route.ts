import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const taskType = String(body.taskType || '');

    if (!taskType || !['math', 'trivia', 'captcha', 'typing', 'waiting'].includes(taskType)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check balance = 0
    const { data: currentUser } = await supabase
      .from('users')
      .select('chip_balance')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.chip_balance > 0) {
      return NextResponse.json(
        { error: 'Tasks are only available when balance is 0' },
        { status: 400 }
      );
    }

    // Check cooldown
    const { data: taskConfig } = await supabase
      .from('task_config')
      .select('cooldown_seconds')
      .eq('task_type', taskType)
      .single();

    if (!taskConfig) {
      return NextResponse.json(
        { error: 'Task configuration not found' },
        { status: 404 }
      );
    }

    const { data: lastCompletion } = await supabase
      .from('task_completions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('task_type', taskType)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (lastCompletion) {
      const now = new Date();
      const completedAt = new Date(lastCompletion.completed_at);
      const elapsed = (now.getTime() - completedAt.getTime()) / 1000;

      if (elapsed < taskConfig.cooldown_seconds) {
        const remaining = Math.floor(taskConfig.cooldown_seconds - elapsed);
        return NextResponse.json(
          {
            error: 'Task is on cooldown',
            cooldownRemaining: remaining,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Task started',
    });
  } catch (error) {
    console.error('Task start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


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
    const completionData = body.completionData || {};

    if (!taskType || !['math', 'trivia', 'captcha', 'typing', 'waiting'].includes(taskType)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify balance = 0
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

    // Verify task completion based on type
    const isValid = await verifyTaskCompletion(taskType, completionData);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Task completion verification failed' },
        { status: 400 }
      );
    }

    // Check cooldown
    const { data: taskConfig } = await supabase
      .from('task_config')
      .select('reward_amount, cooldown_seconds')
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
        return NextResponse.json(
          { error: 'Task is on cooldown' },
          { status: 400 }
        );
      }
    }

    // Award chips
    const rewardAmount = taskConfig.reward_amount;
    const newBalance = currentUser.chip_balance + rewardAmount;

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

    // Log completion
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: user.id,
        task_type: taskType,
        reward_amount: rewardAmount,
        metadata: completionData,
      });

    if (completionError) {
      console.error('Failed to log task completion:', completionError);
    }

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      game_type: 'tedious_task',
      amount: rewardAmount,
      balance_after: newBalance,
      reason: `Task completion: ${taskType}`,
    });

    // Log game history
    await supabase.from('game_history').insert({
      user_id: user.id,
      game_type: 'tedious_task',
      bet_amount: 0,
      result: 'win',
      winnings: rewardAmount,
    });

    return NextResponse.json({
      success: true,
      reward: rewardAmount,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Task complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyTaskCompletion(
  taskType: string,
  completionData: any
): Promise<boolean> {
  switch (taskType) {
    case 'math':
      // Verify 20 problems solved correctly
      return (
        completionData.problemsSolved === 20 &&
        completionData.correctCount === 20
      );

    case 'trivia':
      // Verify 5 correct answers
      return (
        completionData.questionsAnswered === 5 &&
        completionData.correctCount === 5
      );

    case 'captcha':
      // Verify 10 captchas solved
      return completionData.captchasSolved === 10;

    case 'typing':
      // Verify typing completed with minimum time
      return (
        completionData.completed === true &&
        completionData.timeElapsed >= completionData.minTime &&
        completionData.accuracy >= 95
      );

    case 'waiting':
      // Verify waiting completed with minimum time and tab focus
      return (
        completionData.completed === true &&
        completionData.timeElapsed >= completionData.minTime &&
        completionData.tabFocused === true
      );

    default:
      return false;
  }
}


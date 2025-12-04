import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Check user balance - tasks only available when balance = 0
    const { data: currentUser } = await supabase
      .from('users')
      .select('chip_balance')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.chip_balance > 0) {
      return NextResponse.json({
        available: false,
        message: 'Tasks are only available when your balance is 0',
        tasks: [],
      });
    }

    // Get task configurations
    const { data: taskConfigs } = await supabase
      .from('task_config')
      .select('*')
      .order('task_type');

    if (!taskConfigs || taskConfigs.length === 0) {
      return NextResponse.json({
        available: true,
        tasks: [],
      });
    }

    // Get last completion time for each task type to check cooldowns
    const { data: lastCompletions } = await supabase
      .from('task_completions')
      .select('task_type, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    const completionMap = new Map<string, Date>();
    lastCompletions?.forEach((comp) => {
      if (!completionMap.has(comp.task_type)) {
        completionMap.set(comp.task_type, new Date(comp.completed_at));
      }
    });

    // Build task list with cooldown status
    const now = new Date();
    const tasks = taskConfigs.map((config) => {
      const lastCompletion = completionMap.get(config.task_type);
      let cooldownRemaining = 0;
      let isOnCooldown = false;

      if (lastCompletion) {
        const elapsed = (now.getTime() - lastCompletion.getTime()) / 1000;
        cooldownRemaining = Math.max(0, config.cooldown_seconds - elapsed);
        isOnCooldown = cooldownRemaining > 0;
      }

      return {
        type: config.task_type,
        reward: config.reward_amount,
        cooldownSeconds: config.cooldown_seconds,
        cooldownRemaining: Math.floor(cooldownRemaining),
        isOnCooldown,
        canStart: !isOnCooldown,
      };
    });

    return NextResponse.json({
      available: true,
      tasks,
    });
  } catch (error) {
    console.error('Tasks list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


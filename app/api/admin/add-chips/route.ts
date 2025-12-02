import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { userId, amount, reason } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current user balance
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('chip_balance')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const newBalance = targetUser.chip_balance + amount;

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ chip_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        balance_after: newBalance,
        reason: reason || 'Admin adjustment',
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      // Balance was updated, but transaction log failed - not critical
    }

    return NextResponse.json({
      success: true,
      newBalance,
      transaction: transaction || null,
    });
  } catch (error) {
    console.error('Add chips error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


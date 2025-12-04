import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This endpoint can be used for active task status tracking
    // For now, return empty status (can be extended for waiting game or other active tasks)
    return NextResponse.json({
      activeTask: null,
      status: 'idle',
    });
  } catch (error) {
    console.error('Task status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


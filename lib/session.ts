import { cookies } from 'next/headers';
import { createServerClient } from './supabase';

const SESSION_COOKIE_NAME = 'casino_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  chip_balance: number;
  is_admin: boolean;
}

export async function createSession(userId: string): Promise<string> {
  const supabase = createServerClient();
  
  // Create a simple session token (in production, use JWT)
  const sessionToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  
  // Store session in database or use a more secure approach
  // For now, we'll use cookies with the user ID
  return sessionToken;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // Decode session token
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    if (!userId) {
      return null;
    }

    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, chip_balance, is_admin')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return user as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const sessionToken = await createSession(userId);
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}


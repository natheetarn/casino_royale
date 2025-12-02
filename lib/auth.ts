import bcrypt from 'bcryptjs';
import { createServerClient } from './supabase';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(
  username: string,
  email: string,
  password: string
) {
  const supabase = createServerClient();
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      email,
      password_hash: passwordHash,
      chip_balance: 10000, // Starting chips
      is_admin: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserByUsername(username: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function verifyUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // Don't return password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}


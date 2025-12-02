/**
 * Utility script to create an admin user
 * Usage: node scripts/create-admin.js <username> <email> <password>
 * 
 * Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin(username, email, password) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      console.error(`Error: User with email ${email} or username ${username} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        chip_balance: 10000,
        is_admin: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${data.username}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Admin: ${data.is_admin}`);
    console.log(`   Starting chips: ${data.chip_balance}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const [,, username, email, password] = process.argv;

if (!username || !email || !password) {
  console.error('Usage: node scripts/create-admin.js <username> <email> <password>');
  process.exit(1);
}

createAdmin(username, email, password);


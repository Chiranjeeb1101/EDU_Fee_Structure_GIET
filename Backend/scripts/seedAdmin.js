/**
 * Seed script: Create the default admin user for GIET
 * Run with:  node scripts/seedAdmin.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedAdmin() {
  const email = 'admin@giet.edu';
  const password = 'Admin@2024!';
  const fullName = 'GIET Administrator';
  const collegeId = process.env.DEFAULT_COLLEGE_ID;

  console.log('🔧 Creating admin user in Supabase Auth...');

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('⚠️  Auth user already exists. Checking users table...');
      
      // Check if user row exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .single();
      
      if (existing) {
        console.log('✅ Admin user already exists in the users table:', existing);
        return;
      }

      // Auth user exists but no users row — get the auth user id
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const authUser = users.find(u => u.email === email);
      if (!authUser) {
        console.error('❌ Could not find auth user by email. Aborting.');
        process.exit(1);
      }

      // Insert the users row
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          auth_id: authUser.id,
          college_id: collegeId,
          email,
          full_name: fullName,
          role: 'admin',
        }])
        .select()
        .single();

      if (userError) {
        console.error('❌ Failed to insert user row:', userError.message);
        process.exit(1);
      }

      console.log('✅ Admin user row created:', newUser.id);
      return;
    }

    console.error('❌ Auth error:', authError.message);
    process.exit(1);
  }

  const authId = authData.user.id;
  console.log('✅ Auth user created:', authId);

  // 2. Insert into `users` table as admin
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert([{
      auth_id: authId,
      college_id: collegeId,
      email,
      full_name: fullName,
      role: 'admin',
    }])
    .select()
    .single();

  if (userError) {
    console.error('❌ Failed to insert user row:', userError.message);
    await supabase.auth.admin.deleteUser(authId);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   User ID:', newUser.id);
}

seedAdmin().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

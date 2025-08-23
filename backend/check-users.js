// Check if there are any users in the system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.log('\nPlease check your .env file contains:');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Checking for existing users...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Get all users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    console.log(`\n📊 Found ${users.users.length} user(s) in the system:`);
    
    if (users.users.length === 0) {
      console.log('\n❌ No users found in the system.');
      console.log('\n🎯 Next steps:');
      console.log('1. Create a user account through your app\'s registration page');
      console.log('2. Or create a user directly in Supabase Dashboard');
      console.log('3. Then make that user an admin using one of these methods:');
      console.log('   - Supabase Dashboard → Authentication → Users → Edit metadata');
      console.log('   - Run: node src/scripts/set-admin.js user@example.com');
    } else {
      console.log('\n👥 User List:');
      users.users.forEach((user, index) => {
        const role = user.user_metadata?.role || 'user';
        const isAdmin = role === 'admin';
        console.log(`${index + 1}. ${user.email} (${role}) ${isAdmin ? '👑' : ''}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      const adminUsers = users.users.filter(u => u.user_metadata?.role === 'admin');
      
      if (adminUsers.length === 0) {
        console.log('⚠️  No admin users found!');
        console.log('\n🎯 To make a user admin, run:');
        console.log(`node src/scripts/set-admin.js ${users.users[0].email}`);
      } else {
        console.log(`✅ Found ${adminUsers.length} admin user(s)!`);
        console.log('\n🎯 You can now:');
        console.log('1. Log in with an admin account');
        console.log('2. Access /admin/pos page');
        console.log('3. Start managing POS terminals');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🔑 This looks like an API key issue.');
      console.log('Make sure you\'re using the SERVICE ROLE key, not the anon key.');
      console.log('You can find it in Supabase Dashboard → Settings → API');
    }
  }
}

checkUsers();
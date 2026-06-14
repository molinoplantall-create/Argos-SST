const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDB() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("=== AUTH USERS ===");
  const { data: { users } } = await supabase.auth.admin.listUsers();
  users.forEach(u => console.log(u.email, u.id));

  console.log("\n=== PROFILES ===");
  const { data: profiles } = await supabase.from('profiles').select('*');
  profiles.forEach(p => console.log(p.email, p.id, p.role_id));
}

checkDB();

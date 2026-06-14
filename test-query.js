const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testQuery() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = createClient(url, serviceKey);

  // Hardcode the user.id we know exists
  const userId = 'dbc9b61f-a294-49f1-ac43-c6536b0b22b4';

  const { data, error } = await admin
    .from('profiles')
    .select('roles(name), role_id')
    .eq('id', userId)
    .single();

  console.log("Result:", data);
  if (error) console.error("Error:", error.message);
}

testQuery();

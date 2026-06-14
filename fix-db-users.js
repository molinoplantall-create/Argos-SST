const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixProfile() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Obtener todos los usuarios de auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error obteniendo usuarios:', authError);
    return;
  }

  if (users.length === 0) {
    console.log('No hay usuarios registrados en auth.users.');
    return;
  }

  // 2. Obtener cliente y rol admin
  const { data: client } = await supabase.from('clients').select('id').limit(1).single();
  const { data: role } = await supabase.from('roles').select('id').eq('name', 'SUPERADMIN').single();

  const clientId = client ? client.id : null;
  const roleId = role ? role.id : null;

  if (!clientId || !roleId) {
    console.error('No se encontro el cliente o el rol SUPERADMIN en la base de datos.');
    return;
  }

  // 3. Revisar y crear perfiles faltantes
  for (const user of users) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    
    if (!profile) {
      console.log(`Creando perfil SUPERADMIN para el usuario ${user.email} (${user.id})...`);
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        client_id: clientId,
        role_id: roleId,
        full_name: user.email.split('@')[0],
        email: user.email,
        is_active: true
      });

      if (insertError) {
        console.error('Error insertando perfil:', insertError);
      } else {
        console.log('Perfil creado con éxito.');
      }
    } else {
      console.log(`El usuario ${user.email} ya tiene un perfil. Actualizando a SUPERADMIN...`);
      await supabase.from('profiles').update({ role_id: roleId, client_id: clientId }).eq('id', user.id);
      console.log('Perfil actualizado.');
    }
  }

  console.log('Proceso finalizado.');
}

fixProfile();

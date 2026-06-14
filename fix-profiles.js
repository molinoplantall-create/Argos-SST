const { createClient } = require('@supabase/supabase-js');

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

  // 2. Obtener el cliente principal (para asignar)
  const { data: client } = await supabase.from('clients').select('id').eq('legal_name', 'MINERA INMACULADA CONCEPCION Y MILAGROSA').single();

  const clientId = client ? client.id : null;

  // 3. Revisar y crear perfiles faltantes
  for (const user of users) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    
    if (!profile) {
      console.log(`Creando perfil para el usuario ${user.email} (${user.id})...`);
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        client_id: clientId,
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
      console.log(`El usuario ${user.email} ya tiene un perfil.`);
    }
  }

  console.log('Proceso finalizado.');
}

fixProfile();

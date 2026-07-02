import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabaseServer';

// Cliente con privilegios de administrador (service_role)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada en las variables de entorno.');
  
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Verificar que el usuario que hace la petición sea ADMIN o SUPERADMIN
async function verifyAdminAccess(): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) return { allowed: false, reason: 'No user found in session' };

    // Usamos el admin client para leer el rol y esquivar posibles bloqueos de RLS
    const admin = getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('roles(name), role_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return { allowed: false, reason: `DB Error: ${error.message}` };
    }
    
    if (!profile) {
      return { allowed: false, reason: `No se encontró perfil para el usuario (${user.id}). Asegúrate de que tu usuario tenga un registro en la tabla 'profiles'.` };
    }

    const roleName = (profile?.roles as any)?.name;
    if (['SUPERADMIN', 'ADMIN_SST'].includes(roleName)) {
      return { allowed: true };
    } else {
      return { allowed: false, reason: `Role mismatch. Expected SUPERADMIN/ADMIN_SST, got ${roleName}. role_id is ${profile?.role_id}` };
    }
  } catch (err: any) {
    return { allowed: false, reason: `Exception in verifyAdminAccess: ${err.message}` };
  }
}

// ─── GET — Listar todos los usuarios con sus perfiles ───────────────────────
export async function GET() {
  const access = await verifyAdminAccess();
  if (!access.allowed) {
    return NextResponse.json({ error: `No autorizado: ${access.reason}` }, { status: 403 });
  }

  try {
    const admin = getAdminClient();
    const { data: { users }, error } = await admin.auth.admin.listUsers();
    if (error) throw error;

    // Traer también los perfiles para enriquecer la respuesta
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, email, is_active, roles(name, description), position, area, created_at');

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const result = users.map((u) => {
      const profile = profileMap.get(u.id) as any;
      return {
        id: u.id,
        email: u.email,
        fullName: profile?.full_name ?? u.email?.split('@')[0] ?? '—',
        role: profile?.roles?.name ?? 'Sin rol',
        roleDescription: profile?.roles?.description ?? '',
        position: profile?.position ?? '',
        area: profile?.area ?? '',
        isActive: profile?.is_active ?? true,
        emailConfirmed: !!u.email_confirmed_at,
        lastSignIn: u.last_sign_in_at,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json({ users: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST — Crear nuevo usuario ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const access = await verifyAdminAccess();
  if (!access.allowed) {
    return NextResponse.json({ error: `No autorizado: ${access.reason}` }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, fullName, roleId, position, area } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Correo, contraseña y nombre son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // Crear usuario en Supabase Auth (con email ya confirmado)
    const { data: { user }, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Sin necesidad de confirmar por correo
    });

    if (createError) {
      if (createError.message.includes('already registered'))
        return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 });
      throw createError;
    }

    if (!user) throw new Error('No se pudo crear el usuario.');

    // Obtener client_id del admin que hace la petición
    const supabase = await createServerClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    const { data: adminProfile } = await admin
      .from('profiles')
      .select('client_id')
      .eq('id', adminUser!.id)
      .single();

    // Crear perfil en la tabla profiles
    await admin.from('profiles').upsert({
      id: user.id,
      email,
      full_name: fullName,
      role_id: roleId || null,
      position: position || null,
      area: area || null,
      client_id: (adminProfile as any)?.client_id || null,
      is_active: true,
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH — Cambiar contraseña o estado activo ──────────────────────────────
export async function PATCH(req: NextRequest) {
  const access = await verifyAdminAccess();
  if (!access.allowed) {
    return NextResponse.json({ error: `No autorizado: ${access.reason}` }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, password, isActive, fullName, roleId, position, area } = body;

    if (!userId) return NextResponse.json({ error: 'userId es obligatorio.' }, { status: 400 });

    const admin = getAdminClient();

    // Cambiar contraseña si se proporcionó
    if (password) {
      if (password.length < 8)
        return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });

      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
    }

    // Actualizar perfil
    const profileUpdates: Record<string, any> = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (roleId !== undefined) profileUpdates.role_id = roleId;
    if (position !== undefined) profileUpdates.position = position;
    if (area !== undefined) profileUpdates.area = area;
    if (isActive !== undefined) profileUpdates.is_active = isActive;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await admin.from('profiles').update(profileUpdates).eq('id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE — Eliminar usuario ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const access = await verifyAdminAccess();
  if (!access.allowed) {
    return NextResponse.json({ error: `No autorizado: ${access.reason}` }, { status: 403 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId es obligatorio.' }, { status: 400 });

    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { supabase } from './supabase';

export const seedInitialData = async () => {
  console.log('Iniciando carga de datos iniciales...');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No hay una sesión activa. Por favor inicia sesión primero.' };
    }

    // 1. Roles
    const { error: rErr } = await supabase.from('roles').upsert([
      { name: 'SUPERADMIN', permissions: ['*'] },
      { name: 'INSPECTOR', permissions: ['read:inspections', 'create:inspections', 'create:findings'] },
      { name: 'RESPONSABLE', permissions: ['read:findings', 'update:findings'] }
    ], { onConflict: 'name' }).select();
    if (rErr) throw new Error(`Error roles: ${rErr.message}`);

    // 2. Tipos de Inspección
    const { error: tErr } = await supabase.from('inspection_types').upsert([
      { name: 'MENSUAL', description: 'Inspección ordinaria mensual de seguridad' },
      { name: 'GERENCIAL', description: 'Inspección de alta dirección' },
      { name: 'OPINIÓN', description: 'Inspección técnica de especialistas' },
      { name: 'INOPINADA', description: 'Inspección sin previo aviso' }
    ], { onConflict: 'name' });
    if (tErr) throw new Error(`Error types: ${tErr.message}`);

    // 3. Versión de Plantilla
    const { error: tvErr } = await supabase.from('template_versions').upsert([
      { name: 'Plantilla Estándar SST 2026', version_code: 'V1-2026', config: {} }
    ], { onConflict: 'version_code' });
    if (tvErr) throw new Error(`Error template: ${tvErr.message}`);

    // 4. Áreas y Subáreas
    const areasData = [
      { name: 'PLANTA DE BENEFICIO', subareas: ['CHANCADO', 'MOLIENDA', 'FLOTACIÓN', 'FILTRADO'] },
      { name: 'MINA', subareas: ['TAJO ABIERTO', 'SOCAVÓN', 'POLVORÍN', 'MANTENIMIENTO'] },
      { name: 'SERVICIOS GENERALES', subareas: ['CAMPAMENTO', 'COMEDOR', 'OFICINAS', 'ALMACÉN'] }
    ];

    for (const area of areasData) {
      const { data: areaObj, error: aErr } = await supabase
        .from('areas')
        .upsert({ name: area.name }, { onConflict: 'name' })
        .select()
        .single();
      
      if (aErr) throw new Error(`Error area ${area.name}: ${aErr.message}`);

      if (areaObj) {
        const subareasToInsert = area.subareas.map(s => ({
          area_id: areaObj.id,
          name: s
        }));
        
        const { error: saErr } = await supabase.from('subareas').upsert(subareasToInsert, { onConflict: 'area_id, name' });
        if (saErr) throw new Error(`Error subareas for ${area.name}: ${saErr.message}`);
      }
    }

    // 5. Versión IPERC
    const { data: ipercVersion, error: ivErr } = await supabase.from('iperc_versions').upsert([
      { code: 'IPERC-BASE-2026', is_active: true }
    ], { onConflict: 'code' }).select().single();
    if (ivErr) throw new Error(`Error iperc_version: ${ivErr.message}`);

    if (ipercVersion) {
      // Peligros genéricos para probar
      const { data: subarea } = await supabase.from('subareas').select('id').limit(1).single();
      if (subarea) {
        const { error: ihErr } = await supabase.from('iperc_hazards').upsert([
          { version_id: ipercVersion.id, subarea_id: subarea.id, code: 'P01', description: 'Ruido excesivo', risk_level: 'MEDIO' },
          { version_id: ipercVersion.id, subarea_id: subarea.id, code: 'P02', description: 'Caída a distinto nivel', risk_level: 'ALTO' },
          { version_id: ipercVersion.id, subarea_id: subarea.id, code: 'P03', description: 'Atrapamiento por partes móviles', risk_level: 'ALTO' }
        ], { onConflict: 'version_id, subarea_id, code' });
        if (ihErr) throw new Error(`Error iperc_hazards: ${ihErr.message}`);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return { success: false, error: error.message };
  }
};

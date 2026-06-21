-- ============================================================
-- MIGRACIÓN: Asegurar que worker_epp_assignments existe y tiene
-- los campos correctos. Ejecutar en Supabase SQL Editor.
-- ============================================================

-- 1. Enum worker_epp_status (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_epp_status') THEN
    CREATE TYPE worker_epp_status AS ENUM ('ACTIVO', 'BAJA', 'REEMPLAZADO', 'PERDIDO', 'DEVUELTO');
  END IF;
END $$;

-- 2. Crear tabla worker_epp_assignments si no existe
CREATE TABLE IF NOT EXISTS worker_epp_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  epp_id UUID REFERENCES epp_catalog(id),
  delivery_id UUID REFERENCES epp_deliveries(id) ON DELETE SET NULL,
  delivery_item_id UUID REFERENCES epp_delivery_items(id) ON DELETE SET NULL,
  epp_name TEXT NOT NULL,
  body_zone TEXT,
  size TEXT,
  certification TEXT,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status worker_epp_status NOT NULL DEFAULT 'ACTIVO',
  current_condition TEXT DEFAULT 'BUENO',
  last_inspection_id UUID,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_worker_epp_assignments_worker_id ON worker_epp_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_epp_assignments_client_status ON worker_epp_assignments(client_id, status);

-- 4. Habilitar RLS
ALTER TABLE worker_epp_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Política de acceso
DROP POLICY IF EXISTS "worker_epp_assignments_client_access" ON worker_epp_assignments;
CREATE POLICY "worker_epp_assignments_client_access" ON worker_epp_assignments
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

-- 6. Corregir tabla epp_inspections: agregar campo inspector_id si falta
-- (el código usa inspector_id pero el schema tiene inspected_by_id)
ALTER TABLE epp_inspections
  ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS inspector_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS worker_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS document_code TEXT;

-- 7. Verificar que todo está OK
SELECT 
  'worker_epp_assignments' AS tabla,
  COUNT(*) AS total_registros
FROM worker_epp_assignments;

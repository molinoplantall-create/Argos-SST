-- ARGOS SST - esquema completo inicial para Supabase
-- Base multi-cliente para SST, inspecciones, hallazgos y entrega de EPP.
-- Ejecutar en Supabase SQL Editor sobre una base limpia.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. Enumeraciones de negocio
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_name') THEN
    CREATE TYPE role_name AS ENUM (
      'SUPERADMIN',
      'GERENCIA',
      'ADMIN_SST',
      'AREA_SSTO',
      'INSPECTOR',
      'SUPERVISOR',
      'OPERACIONES',
      'VISUALIZADOR'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
    CREATE TYPE inspection_status AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CERRADA', 'ANULADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finding_status') THEN
    CREATE TYPE finding_status AS ENUM ('ABIERTO', 'EN_PROCESO', 'CERRADO', 'ANULADO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('A', 'B', 'C');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE document_status AS ENUM ('BORRADOR', 'EMITIDO', 'FIRMADO', 'APROBADO', 'ANULADO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_status') THEN
    CREATE TYPE worker_status AS ENUM ('ACTIVO', 'CESADO', 'SUSPENDIDO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_epp_status') THEN
    CREATE TYPE worker_epp_status AS ENUM ('ACTIVO', 'BAJA', 'REEMPLAZADO', 'PERDIDO', 'DEVUELTO');
  END IF;
END $$;

-- =========================================================
-- 2. Clientes, roles y usuarios
-- =========================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  ruc TEXT,
  address TEXT,
  economic_activity TEXT,
  logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#1E93AB',
  brand_secondary_color TEXT DEFAULT '#134686',
  brand_accent_color TEXT DEFAULT '#FF7F11',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name role_name UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id),
  position TEXT,
  area TEXT,
  signature_url TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

-- =========================================================
-- 3. Maestros operativos
-- =========================================================

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, name)
);

CREATE TABLE IF NOT EXISTS subareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(area_id, name)
);

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  document_number TEXT,
  employee_code TEXT,
  position TEXT,
  area TEXT,
  start_date DATE,
  status worker_status NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_client_id ON areas(client_id);
CREATE INDEX IF NOT EXISTS idx_subareas_client_id ON subareas(client_id);
CREATE INDEX IF NOT EXISTS idx_workers_client_id ON workers(client_id);

-- =========================================================
-- 4. IPERC y peligros
-- =========================================================

CREATE TABLE IF NOT EXISTS iperc_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, code)
);

CREATE TABLE IF NOT EXISTS iperc_hazards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  version_id UUID REFERENCES iperc_versions(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id),
  subarea_id UUID REFERENCES subareas(id),
  code TEXT,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  controls JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iperc_versions_client_id ON iperc_versions(client_id);
CREATE INDEX IF NOT EXISTS idx_iperc_hazards_client_id ON iperc_hazards(client_id);

-- =========================================================
-- 5. Plantillas e inspecciones
-- =========================================================

CREATE TABLE IF NOT EXISTS inspection_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(client_id, name)
);

CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version_code TEXT NOT NULL,
  document_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, name, version_code)
);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES profiles(id),
  area_id UUID REFERENCES areas(id),
  subarea_id UUID REFERENCES subareas(id),
  type_id UUID REFERENCES inspection_types(id),
  template_id UUID REFERENCES template_versions(id),
  status inspection_status NOT NULL DEFAULT 'PENDIENTE',
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_compliant BOOLEAN DEFAULT TRUE,
  observation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inspections_client_id ON inspections(client_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id ON inspection_items(inspection_id);

-- =========================================================
-- 6. Hallazgos, fotos, acciones y firmas
-- =========================================================

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inspection_items(id),
  hazard_id UUID REFERENCES iperc_hazards(id),
  observation TEXT NOT NULL,
  root_cause TEXT,
  finding_type TEXT,
  severity severity_level NOT NULL,
  status finding_status NOT NULL DEFAULT 'ABIERTO',
  responsible_id UUID REFERENCES profiles(id),
  deadline DATE,
  ai_suggestion JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finding_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDIENTE',
  completion_date DATE,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signature_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  signer_name TEXT,
  signature_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_client_id ON findings(client_id);
CREATE INDEX IF NOT EXISTS idx_findings_inspection_id ON findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_signature_records_lookup ON signature_records(record_type, record_id);

-- =========================================================
-- 7. Gestion documental SST
-- =========================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'BORRADOR',
  document_code TEXT,
  title TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

-- =========================================================
-- 8. Modulo EPP: catalogo, inspeccion y entrega
-- =========================================================

CREATE TABLE IF NOT EXISTS epp_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body_zone TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Unidad',
  brand TEXT,
  model TEXT,
  certification TEXT,
  technical_standard TEXT,
  unit_price NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'PEN',
  supplier TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, name)
);

CREATE TABLE IF NOT EXISTS epp_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  worker_id UUID NOT NULL REFERENCES workers(id),
  delivered_by_id UUID NOT NULL REFERENCES profiles(id),
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status document_status NOT NULL DEFAULT 'BORRADOR',
  document_code TEXT,
  worker_signature_url TEXT,
  delivered_by_signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS epp_delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES epp_deliveries(id) ON DELETE CASCADE,
  epp_id UUID REFERENCES epp_catalog(id),
  epp_name TEXT NOT NULL,
  body_zone TEXT,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Unidad',
  size TEXT,
  certification TEXT,
  unit_price NUMERIC(12, 2),
  currency TEXT DEFAULT 'PEN',
  observation TEXT,
  worker_signature_url TEXT,
  signed_at TIMESTAMPTZ
);

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

CREATE TABLE IF NOT EXISTS epp_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id),
  inspected_by_id UUID REFERENCES profiles(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status document_status NOT NULL DEFAULT 'BORRADOR',
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epp_catalog_client_id ON epp_catalog(client_id);
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_client_id ON epp_deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_epp_deliveries_worker_id ON epp_deliveries(worker_id);
CREATE INDEX IF NOT EXISTS idx_epp_delivery_items_delivery_id ON epp_delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_worker_epp_assignments_worker_id ON worker_epp_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_epp_assignments_client_status ON worker_epp_assignments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_epp_inspections_client_id ON epp_inspections(client_id);

-- =========================================================
-- 9. ATS y PETAR, preparados para modulos futuros
-- =========================================================

CREATE TABLE IF NOT EXISTS ats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  task_description TEXT NOT NULL,
  hazards JSONB NOT NULL DEFAULT '[]'::JSONB,
  controls JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS petar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  work_type TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 10. Funciones utilitarias y RLS
-- =========================================================

CREATE OR REPLACE FUNCTION public.current_profile_client_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS role_name
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT roles.name
  FROM public.profiles
  JOIN public.roles ON roles.id = profiles.role_id
  WHERE profiles.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(public.current_profile_role() = 'SUPERADMIN', FALSE)
$$;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iperc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE iperc_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE epp_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE epp_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE epp_delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_epp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE epp_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats ENABLE ROW LEVEL SECURITY;
ALTER TABLE petar ENABLE ROW LEVEL SECURITY;

-- Politicas base: separar clientes y permitir superadmin.
-- En una etapa posterior las endurecemos por accion/rol.

DROP POLICY IF EXISTS "clients_select_same_or_superadmin" ON clients;
DROP POLICY IF EXISTS "profiles_select_same_or_self_or_superadmin" ON profiles;
DROP POLICY IF EXISTS "roles_select_authenticated" ON roles;
DROP POLICY IF EXISTS "areas_client_access" ON areas;
DROP POLICY IF EXISTS "subareas_client_access" ON subareas;
DROP POLICY IF EXISTS "workers_client_access" ON workers;
DROP POLICY IF EXISTS "iperc_versions_client_access" ON iperc_versions;
DROP POLICY IF EXISTS "iperc_hazards_client_access" ON iperc_hazards;
DROP POLICY IF EXISTS "inspection_types_client_access" ON inspection_types;
DROP POLICY IF EXISTS "template_versions_client_access" ON template_versions;
DROP POLICY IF EXISTS "inspections_client_access" ON inspections;
DROP POLICY IF EXISTS "inspection_items_parent_access" ON inspection_items;
DROP POLICY IF EXISTS "findings_client_access" ON findings;
DROP POLICY IF EXISTS "finding_photos_parent_access" ON finding_photos;
DROP POLICY IF EXISTS "corrective_actions_parent_access" ON corrective_actions;
DROP POLICY IF EXISTS "signature_records_client_access" ON signature_records;
DROP POLICY IF EXISTS "documents_client_access" ON documents;
DROP POLICY IF EXISTS "epp_catalog_client_access" ON epp_catalog;
DROP POLICY IF EXISTS "epp_deliveries_client_access" ON epp_deliveries;
DROP POLICY IF EXISTS "epp_delivery_items_parent_access" ON epp_delivery_items;
DROP POLICY IF EXISTS "worker_epp_assignments_client_access" ON worker_epp_assignments;
DROP POLICY IF EXISTS "epp_inspections_client_access" ON epp_inspections;
DROP POLICY IF EXISTS "ats_client_access" ON ats;
DROP POLICY IF EXISTS "petar_client_access" ON petar;

CREATE POLICY "clients_select_same_or_superadmin" ON clients
  FOR SELECT USING (public.is_superadmin() OR id = public.current_profile_client_id());

CREATE POLICY "profiles_select_same_or_self_or_superadmin" ON profiles
  FOR SELECT USING (public.is_superadmin() OR id = auth.uid() OR client_id = public.current_profile_client_id());

CREATE POLICY "roles_select_authenticated" ON roles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "areas_client_access" ON areas
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "subareas_client_access" ON subareas
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "workers_client_access" ON workers
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "iperc_versions_client_access" ON iperc_versions
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "iperc_hazards_client_access" ON iperc_hazards
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "inspection_types_client_access" ON inspection_types
  FOR ALL USING (client_id IS NULL OR public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (client_id IS NULL OR public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "template_versions_client_access" ON template_versions
  FOR ALL USING (client_id IS NULL OR public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (client_id IS NULL OR public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "inspections_client_access" ON inspections
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "inspection_items_parent_access" ON inspection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspections.id = inspection_items.inspection_id
      AND (public.is_superadmin() OR inspections.client_id = public.current_profile_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspections.id = inspection_items.inspection_id
      AND (public.is_superadmin() OR inspections.client_id = public.current_profile_client_id())
    )
  );

CREATE POLICY "findings_client_access" ON findings
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "finding_photos_parent_access" ON finding_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_photos.finding_id
      AND (public.is_superadmin() OR findings.client_id = public.current_profile_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = finding_photos.finding_id
      AND (public.is_superadmin() OR findings.client_id = public.current_profile_client_id())
    )
  );

CREATE POLICY "corrective_actions_parent_access" ON corrective_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = corrective_actions.finding_id
      AND (public.is_superadmin() OR findings.client_id = public.current_profile_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM findings
      WHERE findings.id = corrective_actions.finding_id
      AND (public.is_superadmin() OR findings.client_id = public.current_profile_client_id())
    )
  );

CREATE POLICY "signature_records_client_access" ON signature_records
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "documents_client_access" ON documents
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "epp_catalog_client_access" ON epp_catalog
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "epp_deliveries_client_access" ON epp_deliveries
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "epp_delivery_items_parent_access" ON epp_delivery_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM epp_deliveries
      WHERE epp_deliveries.id = epp_delivery_items.delivery_id
      AND (public.is_superadmin() OR epp_deliveries.client_id = public.current_profile_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM epp_deliveries
      WHERE epp_deliveries.id = epp_delivery_items.delivery_id
      AND (public.is_superadmin() OR epp_deliveries.client_id = public.current_profile_client_id())
    )
  );

CREATE POLICY "worker_epp_assignments_client_access" ON worker_epp_assignments
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "epp_inspections_client_access" ON epp_inspections
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "ats_client_access" ON ats
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

CREATE POLICY "petar_client_access" ON petar
  FOR ALL USING (public.is_superadmin() OR client_id = public.current_profile_client_id())
  WITH CHECK (public.is_superadmin() OR client_id = public.current_profile_client_id());

-- =========================================================
-- 11. Semillas iniciales
-- =========================================================

INSERT INTO roles (name, description, permissions)
VALUES
  ('SUPERADMIN', 'Control total del sistema', '["*"]'::JSONB),
  ('GERENCIA', 'Visualiza indicadores y aprueba documentos criticos', '["dashboard:read","documents:read","inspections:read","findings:read","reports:read"]'::JSONB),
  ('ADMIN_SST', 'Administra configuracion SST del cliente', '["*"]'::JSONB),
  ('AREA_SSTO', 'Gestiona inspecciones, documentos y hallazgos SST', '["documents:create","documents:read","documents:update","inspections:create","inspections:read","inspections:update","findings:create","findings:read","findings:update","reports:read"]'::JSONB),
  ('INSPECTOR', 'Ejecuta inspecciones y registra evidencias', '["inspections:create","inspections:read","inspections:update","findings:create","findings:read","documents:create","documents:read"]'::JSONB),
  ('SUPERVISOR', 'Gestiona levantamiento de hallazgos asignados', '["inspections:read","findings:read","findings:update","corrective_actions:update"]'::JSONB),
  ('OPERACIONES', 'Consulta y atiende acciones operativas', '["dashboard:read","inspections:read","findings:read","findings:update"]'::JSONB),
  ('VISUALIZADOR', 'Solo lectura', '["dashboard:read","documents:read","inspections:read","findings:read"]'::JSONB)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

INSERT INTO clients (legal_name, trade_name, ruc, address, economic_activity)
VALUES (
  'MINERA INMACULADA CONCEPCION Y MILAGROSA',
  'Minera Inmaculada Concepcion y Milagrosa',
  '20534547715',
  'CALLE TRUJILLO 351 - PALPA / SARAMARCA',
  'MINERIA'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_types (client_id, name, description)
SELECT id, 'PLANEADA MENSUAL', 'Inspeccion planificada mensual'
FROM clients
WHERE legal_name = 'MINERA INMACULADA CONCEPCION Y MILAGROSA'
ON CONFLICT DO NOTHING;

INSERT INTO inspection_types (client_id, name, description)
SELECT id, 'PLANEADA GERENCIAL', 'Inspeccion gerencial'
FROM clients
WHERE legal_name = 'MINERA INMACULADA CONCEPCION Y MILAGROSA'
ON CONFLICT DO NOTHING;

INSERT INTO inspection_types (client_id, name, description)
SELECT id, 'NO PLANEADA', 'Inspeccion no planificada'
FROM clients
WHERE legal_name = 'MINERA INMACULADA CONCEPCION Y MILAGROSA'
ON CONFLICT DO NOTHING;

INSERT INTO epp_catalog (client_id, name, body_zone, unit)
SELECT id, item.name, item.body_zone, item.unit
FROM clients
CROSS JOIN (
  VALUES
    ('Casco de Seguridad', 'CABEZA', 'Unidad'),
    ('Lentes de Seguridad', 'OJOS', 'Unidad'),
    ('Tapones Auditivos', 'OIDOS', 'Par'),
    ('Respirador / Mascarilla', 'RESPIRATORIO', 'Unidad'),
    ('Chaleco Reflectivo', 'TORSO', 'Unidad'),
    ('Guantes de Seguridad', 'MANOS', 'Par'),
    ('Pantalon de Trabajo', 'PIERNAS', 'Unidad'),
    ('Botas de Seguridad', 'PIES', 'Par')
) AS item(name, body_zone, unit)
WHERE clients.legal_name = 'MINERA INMACULADA CONCEPCION Y MILAGROSA'
ON CONFLICT DO NOTHING;

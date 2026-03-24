-- ============================================================
-- 005: Sistema de aprobaciones para cotizaciones
-- Reglas configurables y registro de aprobaciones por versión
-- Idempotente: seguro de re-ejecutar
-- ============================================================

-- ─── Tabla de reglas de aprobación ─────────────────────────
CREATE TABLE IF NOT EXISTS public.cotizacion_aprobacion_reglas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  descripcion   text,
  nivel         integer NOT NULL DEFAULT 1,
  monto_minimo  numeric(14,2) NOT NULL DEFAULT 0,
  moneda        text NOT NULL DEFAULT 'CLP',
  rol_requerido text NOT NULL DEFAULT 'admin'
    CHECK (rol_requerido IN ('admin', 'ventas', 'operaciones', 'rrhh', 'contabilidad')),
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Tabla de aprobaciones por versión ─────────────────────
CREATE TABLE IF NOT EXISTS public.cotizacion_aprobaciones (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_version_id   uuid NOT NULL REFERENCES public.cotizacion_versiones(id) ON DELETE CASCADE,
  nivel                   integer NOT NULL DEFAULT 1,
  estado                  text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  aprobado_por            uuid REFERENCES public.admin_users(id),
  aprobado_at             timestamptz,
  comentario              text,
  regla_id                uuid REFERENCES public.cotizacion_aprobacion_reglas(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cotizacion_version_id, nivel)
);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_version
  ON public.cotizacion_aprobaciones (cotizacion_version_id);

-- ─── RLS para service_role ─────────────────────────────────
ALTER TABLE public.cotizacion_aprobacion_reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_aprobaciones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cotizacion_aprobacion_reglas' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON public.cotizacion_aprobacion_reglas
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cotizacion_aprobaciones' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON public.cotizacion_aprobaciones
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Trigger updated_at para reglas ────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_aprobacion_reglas_updated_at') THEN
    CREATE TRIGGER trg_aprobacion_reglas_updated_at
      BEFORE UPDATE ON public.cotizacion_aprobacion_reglas
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─── Regla por defecto: montos >= 50.000.000 CLP requieren aprobación admin ──
INSERT INTO public.cotizacion_aprobacion_reglas (nombre, descripcion, nivel, monto_minimo, moneda, rol_requerido)
SELECT
  'Aprobación gerencial',
  'Cotizaciones con monto >= 50.000.000 CLP requieren aprobación de admin',
  1,
  50000000,
  'CLP',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cotizacion_aprobacion_reglas
  WHERE monto_minimo = 50000000 AND moneda = 'CLP' AND nivel = 1
);

COMMENT ON TABLE public.cotizacion_aprobacion_reglas IS 'Reglas configurables de aprobación por monto y nivel';
COMMENT ON TABLE public.cotizacion_aprobaciones IS 'Registro de aprobaciones/rechazos por versión de cotización';

-- ============================================================
-- Modulo de Gastos — Categorias, Presupuestos, FK en movimientos
-- ============================================================

-- Categorias de gastos
CREATE TABLE IF NOT EXISTS public.gastos_categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text UNIQUE NOT NULL,
  icono      text NOT NULL DEFAULT 'tag',
  color      text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Presupuestos por categoria/mes
CREATE TABLE IF NOT EXISTS public.gastos_presupuestos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id  uuid NOT NULL REFERENCES public.gastos_categorias(id) ON DELETE CASCADE,
  centro_costo  text,
  monto         numeric(14,2) NOT NULL,
  mes           integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio          integer NOT NULL CHECK (anio BETWEEN 2020 AND 2100),
  creado_por    uuid REFERENCES public.admin_users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (categoria_id, centro_costo, mes, anio)
);

-- FK opcional en conciliacion_movimientos
ALTER TABLE public.conciliacion_movimientos
  ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES public.gastos_categorias(id);

-- RLS
ALTER TABLE public.gastos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_all ON public.gastos_categorias FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.gastos_presupuestos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed de categorias iniciales
INSERT INTO public.gastos_categorias (nombre, icono, color) VALUES
  ('Materiales', 'box', '#f97316'),
  ('Transporte', 'truck', '#3b82f6'),
  ('Alimentacion', 'utensils', '#10b981'),
  ('Combustible', 'fuel', '#ef4444'),
  ('Herramientas', 'wrench', '#8b5cf6'),
  ('Servicios', 'building', '#06b6d4'),
  ('Personal', 'users', '#ec4899'),
  ('Otros', 'tag', '#6b7280')
ON CONFLICT (nombre) DO NOTHING;

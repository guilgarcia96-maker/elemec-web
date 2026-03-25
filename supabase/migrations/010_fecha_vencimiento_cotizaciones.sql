-- ============================================================
-- 010: Agregar columnas faltantes a cotizaciones
-- Campos usados por el formulario pero no en el schema base
-- ============================================================

ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS fecha_vencimiento date,
  ADD COLUMN IF NOT EXISTS condicion_venta text,
  ADD COLUMN IF NOT EXISTS fecha_validez date,
  ADD COLUMN IF NOT EXISTS vendedor text,
  ADD COLUMN IF NOT EXISTS comision_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS lista_precio text,
  ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'CLP',
  ADD COLUMN IF NOT EXISTS tipo_cambio numeric(14,4),
  ADD COLUMN IF NOT EXISTS sucursal text,
  ADD COLUMN IF NOT EXISTS vigencia_dias integer,
  ADD COLUMN IF NOT EXISTS probabilidad_cierre integer,
  ADD COLUMN IF NOT EXISTS margen_estimado numeric(5,2),
  ADD COLUMN IF NOT EXISTS canal text,
  ADD COLUMN IF NOT EXISTS motivo_perdida text;

-- ============================================================
-- 011: Fix CHECK constraint de tipo_impuesto en cotizacion_items
-- El form envía 'afecta'/'exenta' pero el constraint solo acepta 'iva'/'exento'/'otro'
-- ============================================================

ALTER TABLE public.cotizacion_items
  DROP CONSTRAINT IF EXISTS cotizacion_items_tipo_impuesto_check;

ALTER TABLE public.cotizacion_items
  ADD CONSTRAINT cotizacion_items_tipo_impuesto_check
  CHECK (tipo_impuesto IN ('iva', 'afecta', 'exento', 'exenta', 'otro'));

-- Agregar columnas faltantes a cotizacion_items
ALTER TABLE public.cotizacion_items
  ADD COLUMN IF NOT EXISTS servicio_id uuid,
  ADD COLUMN IF NOT EXISTS alcance_id uuid,
  ADD COLUMN IF NOT EXISTS sku text;

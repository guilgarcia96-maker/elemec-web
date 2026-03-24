-- ============================================================
-- 001: Agregar tipo_impuesto a cotizacion_items
-- Idempotente: seguro de re-ejecutar
-- ============================================================

-- Agregar columna tipo_impuesto con constraint CHECK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cotizacion_items'
      AND column_name = 'tipo_impuesto'
  ) THEN
    ALTER TABLE public.cotizacion_items
      ADD COLUMN tipo_impuesto text NOT NULL DEFAULT 'iva'
        CHECK (tipo_impuesto IN ('iva', 'exento', 'otro'));
  END IF;
END $$;

-- Sincronizar filas existentes donde impuesto_pct = 0 → tipo exento
UPDATE public.cotizacion_items
  SET tipo_impuesto = 'exento'
  WHERE impuesto_pct = 0
    AND tipo_impuesto = 'iva';

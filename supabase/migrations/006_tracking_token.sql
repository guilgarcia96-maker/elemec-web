-- ============================================================
-- 006: Token de seguimiento para clientes
-- Permite al cliente ver estado y aprobar/rechazar cotización
-- Idempotente: seguro de re-ejecutar
-- ============================================================

-- Agregar columna tracking_token
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cotizaciones'
      AND column_name = 'tracking_token'
  ) THEN
    ALTER TABLE public.cotizaciones
      ADD COLUMN tracking_token uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Backfill: asignar token a filas existentes que no tengan
UPDATE public.cotizaciones
  SET tracking_token = gen_random_uuid()
  WHERE tracking_token IS NULL;

-- Hacer NOT NULL después del backfill
DO $$ BEGIN
  -- Verificar si ya es NOT NULL para evitar error
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cotizaciones'
      AND column_name = 'tracking_token'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.cotizaciones
      ALTER COLUMN tracking_token SET NOT NULL;
  END IF;
END $$;

-- Índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_cotizaciones_tracking_token
  ON public.cotizaciones (tracking_token);

COMMENT ON COLUMN public.cotizaciones.tracking_token IS 'Token UUID público para que el cliente pueda consultar estado y aprobar/rechazar la cotización';

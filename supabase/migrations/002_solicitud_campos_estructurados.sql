-- ============================================================
-- 002: Campos estructurados en cotizaciones
-- Antes se concatenaban en comentarios; ahora son columnas propias
-- Idempotente: seguro de re-ejecutar
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'modalidad'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN modalidad text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'plazo_deseado'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN plazo_deseado text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'presupuesto_estimado'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN presupuesto_estimado text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'servicio_principal'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN servicio_principal text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'alcances'
  ) THEN
    ALTER TABLE public.cotizaciones ADD COLUMN alcances text[] DEFAULT '{}';
  END IF;
END $$;

-- Nota: la columna prioridad ya existe en cotizaciones (backoffice-schema.sql)
-- No es necesario agregarla de nuevo.

COMMENT ON COLUMN public.cotizaciones.modalidad IS 'Modalidad de contrato solicitada por el cliente (ej: suma alzada, precios unitarios)';
COMMENT ON COLUMN public.cotizaciones.plazo_deseado IS 'Plazo deseado indicado por el cliente en la solicitud';
COMMENT ON COLUMN public.cotizaciones.presupuesto_estimado IS 'Presupuesto estimado indicado por el cliente';
COMMENT ON COLUMN public.cotizaciones.servicio_principal IS 'Servicio principal solicitado por el cliente';
COMMENT ON COLUMN public.cotizaciones.alcances IS 'Lista de alcances seleccionados por el cliente en la solicitud';

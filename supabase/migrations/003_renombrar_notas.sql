-- ============================================================
-- 003: Renombrar notas → notas_internas en cotizaciones
-- Idempotente: seguro de re-ejecutar
-- ============================================================

DO $$ BEGIN
  -- Solo renombrar si existe la columna notas y NO existe notas_internas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'notas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cotizaciones' AND column_name = 'notas_internas'
  ) THEN
    ALTER TABLE public.cotizaciones RENAME COLUMN notas TO notas_internas;
  END IF;
END $$;

-- Documentar propósito de cada campo relevante
COMMENT ON COLUMN public.cotizaciones.notas_internas IS 'Notas internas del equipo (no visibles al cliente)';
COMMENT ON COLUMN public.cotizaciones.comentarios IS 'Comentarios del cliente enviados en el formulario de solicitud';
COMMENT ON COLUMN public.cotizaciones.observaciones IS 'Observaciones comerciales visibles en la cotización formal';
COMMENT ON COLUMN public.cotizaciones.estado IS 'Estado actual: proceso, nueva, en_revision, cotizada, ganada, perdida';
COMMENT ON COLUMN public.cotizaciones.tipo_registro IS 'Origen del registro: solicitud_cliente o backoffice';
COMMENT ON COLUMN public.cotizaciones.solicitud_id IS 'Referencia a la solicitud original del cliente (si la cotización se creó desde una solicitud)';
COMMENT ON COLUMN public.cotizaciones.motivo_perdida IS 'Razón por la que se perdió la cotización (cuando estado = perdida)';

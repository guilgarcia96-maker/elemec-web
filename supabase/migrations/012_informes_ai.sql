-- ============================================================
-- Informes AI: extensiones para generacion de informes con IA
-- ============================================================

-- Extender tabla informes con campos adicionales
ALTER TABLE public.informes
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS contenido_json jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contenido_html text,
  ADD COLUMN IF NOT EXISTS servicio_tipo text,
  ADD COLUMN IF NOT EXISTS obra text,
  ADD COLUMN IF NOT EXISTS ubicacion text,
  ADD COLUMN IF NOT EXISTS fecha_trabajo date,
  ADD COLUMN IF NOT EXISTS cliente_nombre text,
  ADD COLUMN IF NOT EXISTS cliente_empresa text;

-- Agregar descripcion IA y orden a adjuntos
ALTER TABLE public.informe_adjuntos
  ADD COLUMN IF NOT EXISTS descripcion_ai text,
  ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0;

-- Trigger de folio automatico para informes
CREATE OR REPLACE FUNCTION public.trg_informes_auto_folio()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF new.codigo IS NULL OR btrim(new.codigo) = '' THEN
    new.codigo := public.next_document_code('informe', 'INF');
  END IF;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS trg_informes_auto_folio ON public.informes;
CREATE TRIGGER trg_informes_auto_folio
  BEFORE INSERT ON public.informes
  FOR EACH ROW EXECUTE FUNCTION public.trg_informes_auto_folio();

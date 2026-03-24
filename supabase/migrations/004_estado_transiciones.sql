-- ============================================================
-- 004: Máquina de estados para cotizaciones
-- Valida transiciones permitidas vía trigger
-- Idempotente: seguro de re-ejecutar
-- ============================================================

CREATE OR REPLACE FUNCTION public.validar_transicion_estado()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  transicion_valida boolean := false;
BEGIN
  -- Si el estado no cambia, permitir
  IF OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Definir transiciones permitidas
  CASE OLD.estado
    WHEN 'proceso' THEN
      transicion_valida := NEW.estado IN ('nueva', 'en_revision', 'cotizada');
    WHEN 'nueva' THEN
      transicion_valida := NEW.estado IN ('en_revision', 'cotizada', 'perdida', 'proceso');
    WHEN 'en_revision' THEN
      transicion_valida := NEW.estado IN ('cotizada', 'perdida', 'proceso');
    WHEN 'cotizada' THEN
      transicion_valida := NEW.estado IN ('ganada', 'perdida', 'proceso');
    WHEN 'ganada' THEN
      transicion_valida := false; -- Estado terminal
    WHEN 'perdida' THEN
      transicion_valida := NEW.estado IN ('proceso');
    ELSE
      transicion_valida := false;
  END CASE;

  IF NOT transicion_valida THEN
    RAISE EXCEPTION 'Transición de estado no permitida: % → %', OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger (reemplazar si existe)
DROP TRIGGER IF EXISTS trg_cotizaciones_validar_estado ON public.cotizaciones;
CREATE TRIGGER trg_cotizaciones_validar_estado
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.validar_transicion_estado();

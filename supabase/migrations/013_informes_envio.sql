-- ============================================================
-- Informes: campos para envío por email al cliente
-- ============================================================

ALTER TABLE public.informes
  ADD COLUMN IF NOT EXISTS cliente_email  text,
  ADD COLUMN IF NOT EXISTS enviado_a      text,
  ADD COLUMN IF NOT EXISTS enviado_at     timestamptz;

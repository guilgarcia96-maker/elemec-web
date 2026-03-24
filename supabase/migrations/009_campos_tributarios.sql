-- 009: Campos tributarios chilenos para documentos de gasto/ingreso
-- Agrega campos de facturación electrónica SII a conciliacion_movimientos

ALTER TABLE public.conciliacion_movimientos
  ADD COLUMN IF NOT EXISTS rut_emisor text,
  ADD COLUMN IF NOT EXISTS razon_social_emisor text,
  ADD COLUMN IF NOT EXISTS tipo_documento text CHECK (tipo_documento IN ('boleta','factura','factura_exenta','nota_credito','guia_despacho')),
  ADD COLUMN IF NOT EXISTS monto_neto numeric(14,2),
  ADD COLUMN IF NOT EXISTS monto_iva numeric(14,2),
  ADD COLUMN IF NOT EXISTS monto_total numeric(14,2),
  ADD COLUMN IF NOT EXISTS forma_pago text CHECK (forma_pago IN ('efectivo','transferencia','tarjeta_debito','tarjeta_credito','cheque','otro')),
  ADD COLUMN IF NOT EXISTS rut_receptor text;

COMMENT ON COLUMN public.conciliacion_movimientos.rut_emisor IS 'RUT del proveedor/emisor del documento';
COMMENT ON COLUMN public.conciliacion_movimientos.razon_social_emisor IS 'Nombre legal del emisor';
COMMENT ON COLUMN public.conciliacion_movimientos.tipo_documento IS 'Tipo de documento tributario: boleta, factura, factura_exenta, nota_credito, guia_despacho';
COMMENT ON COLUMN public.conciliacion_movimientos.monto_neto IS 'Monto neto sin IVA';
COMMENT ON COLUMN public.conciliacion_movimientos.monto_iva IS 'Monto IVA (19%)';
COMMENT ON COLUMN public.conciliacion_movimientos.monto_total IS 'Total con IVA incluido';
COMMENT ON COLUMN public.conciliacion_movimientos.forma_pago IS 'Forma de pago: efectivo, transferencia, tarjeta_debito, tarjeta_credito, cheque, otro';
COMMENT ON COLUMN public.conciliacion_movimientos.rut_receptor IS 'RUT del receptor del documento';

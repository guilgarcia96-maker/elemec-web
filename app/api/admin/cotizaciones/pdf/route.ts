import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';
import {
  generateCotizacionHTML,
  type CotizacionLineItem,
  type CotizacionDocRef,
  type CotizacionPDFData,
} from '@/lib/cotizacion-html';

/**
 * GET /api/admin/cotizaciones/pdf?id=<cotizacion_id>
 *
 * Retorna el HTML imprimible de una cotización.
 * El admin puede usar "Imprimir" o "Guardar como PDF" desde el navegador.
 */
export async function GET(req: NextRequest) {
  // 1. Verificar sesión admin
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Obtener ID de cotización
  const cotizacionId = req.nextUrl.searchParams.get('id');
  if (!cotizacionId) {
    return NextResponse.json({ error: 'Parámetro "id" requerido' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Obtener cotización
  const { data: cotiz, error: cotizError } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', cotizacionId)
    .single();

  if (cotizError || !cotiz) {
    return NextResponse.json(
      { error: 'Cotización no encontrada' },
      { status: 404 }
    );
  }

  // 4. Obtener última versión
  const { data: version } = await supabase
    .from('cotizacion_versiones')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('version_num', { ascending: false })
    .limit(1)
    .single();

  // 5. Obtener ítems de la versión
  let items: CotizacionLineItem[] = [];
  if (version?.id) {
    const { data: rawItems } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_version_id', version.id)
      .order('item_num', { ascending: true });

    if (rawItems) {
      items = rawItems.map((item: Record<string, unknown>) => ({
        descripcion:     (item.descripcion as string) ?? '',
        cantidad:        Number(item.cantidad) || 0,
        unidad:          (item.unidad as string) ?? '',
        precio_unitario: Number(item.precio_unitario) || 0,
        descuento_pct:   Number(item.descuento_pct) || 0,
        tipo_impuesto:   (item.tipo_impuesto as 'afecta' | 'exenta') ?? 'afecta',
      }));
    }
  }

  // 6. Extraer datos del snapshot de versión
  const snapshot = (version?.json_snapshot as Record<string, unknown>) ?? {};
  const referencias: CotizacionDocRef[] = Array.isArray(snapshot.referencias)
    ? (snapshot.referencias as CotizacionDocRef[])
    : [];

  // 7. Armar datos para generar HTML
  const pdfData: CotizacionPDFData = {
    codigo:            cotiz.codigo ?? undefined,
    tipo:              cotiz.tipo_documento ?? undefined,
    tipoLabel:         cotiz.tipo_documento ?? 'Cotización',
    fecha:             cotiz.fecha_inicio ?? new Date().toISOString().split('T')[0],
    fechaVigencia:     cotiz.fecha_cierre_estimada ?? undefined,
    fechaVencimiento:  (snapshot.fecha_vencimiento as string) ?? cotiz.fecha_vencimiento ?? undefined,
    condicionVenta:    (version?.condiciones_comerciales as string) ?? cotiz.condicion_venta ?? undefined,
    cliente:           cotiz.compania ?? [cotiz.nombre, cotiz.apellidos].filter(Boolean).join(' ') ?? 'Cliente',
    rutEmpresa:        cotiz.rut_empresa ?? undefined,
    giro:              cotiz.giro ?? undefined,
    direccion:         cotiz.direccion ?? undefined,
    comuna:            cotiz.comuna ?? undefined,
    ciudad:            cotiz.ciudad ?? undefined,
    region:            cotiz.region ?? undefined,
    contacto:          cotiz.contacto ?? undefined,
    cargo:             cotiz.cargo ?? undefined,
    telefono:          cotiz.telefono ?? undefined,
    movil:             cotiz.movil ?? undefined,
    email:             cotiz.email ?? undefined,
    nombreObra:        cotiz.nombre_obra ?? undefined,
    sucursal:          cotiz.sucursal ?? undefined,
    vendedor:          (snapshot.vendedor as string) ?? cotiz.vendedor ?? undefined,
    comisionPct:       (snapshot.comision_pct as number) ?? undefined,
    listaPrecio:       (snapshot.lista_precio as string) ?? cotiz.lista_precio ?? undefined,
    moneda:            (version?.moneda as string) ?? cotiz.moneda ?? 'CLP',
    tipoCambio:        (snapshot.tipo_cambio as string) ?? undefined,
    glosa:             (snapshot.glosa as string) ?? cotiz.glosa ?? undefined,
    observaciones:     cotiz.observaciones ?? undefined,
    items,
    referencias,
  };

  const html = generateCotizacionHTML(pdfData);

  // 8. Retornar HTML con auto-print
  const printableHtml = html.replace(
    '</body>',
    `<script>window.onload=function(){window.print()}</script></body>`
  );

  return new Response(printableHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import NuevaCotizacionForm from '@/components/admin/NuevaCotizacionForm';

export const dynamic = 'force-dynamic';

export default async function CompletarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  const { id } = await params;

  // Cargar la cotización completa
  const { data: cotiz } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!cotiz) redirect('/admin/cotizaciones');

  // Cargar items de la última versión
  const { data: versionRows } = await supabase
    .from('cotizacion_versiones')
    .select('id, version_num, json_snapshot')
    .eq('cotizacion_id', id)
    .order('version_num', { ascending: false })
    .limit(1);

  const latestVersion = versionRows?.[0] ?? null;
  let existingItems: Array<Record<string, unknown>> = [];

  if (latestVersion) {
    const { data: itemRows } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_version_id', latestVersion.id)
      .order('item_num');

    existingItems = (itemRows ?? []) as Array<Record<string, unknown>>;
  }

  // Extraer referencias del json_snapshot
  const snapshot = (latestVersion?.json_snapshot ?? {}) as Record<string, unknown>;
  const existingRefs = Array.isArray(snapshot.referencias) ? snapshot.referencias : [];

  // Construir initialData con TODOS los campos — usar '' para nulls
  const initialData = {
    cliente:        cotiz.compania ?? '',
    nombreObra:     cotiz.nombre_obra ?? '',
    email:          cotiz.email ?? '',
    region:         cotiz.region ?? '',
    tipoServicio:   cotiz.tipo_servicio ?? '',
    contactoNombre: [cotiz.nombre, cotiz.apellidos].filter(Boolean).join(' ') || '',
    direccion:      cotiz.direccion ?? '',
    telefono:       cotiz.telefono ?? '',
    movil:          cotiz.movil ?? '',
    rutEmpresa:     cotiz.rut_empresa ?? '',
    cargo:          cotiz.cargo ?? '',
    prioridad:      cotiz.prioridad ?? '',
    giro:           cotiz.giro ?? '',
    comuna:         cotiz.comuna ?? '',
    ciudad:         cotiz.ciudad ?? '',
    glosa:          cotiz.glosa ?? '',
    vendedor:       cotiz.vendedor ?? '',
    listaPrecio:    cotiz.lista_precio ?? '',
    observaciones:  cotiz.observaciones ?? '',
    nombreDir:      cotiz.nombre_dir ?? '',
    origen:         cotiz.origen ?? '',
    sucursal:       cotiz.sucursal ?? '',
    tipoDocumento:  cotiz.tipo_documento ?? '',
    condVenta:      cotiz.condicion_venta ?? '',
    fecha:          cotiz.fecha_inicio ?? '',
    fechaVigencia:  cotiz.fecha_cierre_estimada ?? '',
    comision:       cotiz.comision_pct != null ? String(cotiz.comision_pct) : '',
    fromFolio:      cotiz.codigo ?? '',
    moneda:         cotiz.moneda ?? 'CLP',
    tipoCambio:     cotiz.tipo_cambio != null ? String(cotiz.tipo_cambio) : '',
    fechaVenc:      cotiz.fecha_vencimiento ?? '',
  };

  return (
    <AdminShell session={session} active="cotizaciones">
      <NuevaCotizacionForm
        key={id}
        tipo={cotiz.tipo_documento ?? ''}
        editingId={id}
        initialData={initialData}
        initialItems={existingItems}
        initialRefs={existingRefs}
      />
    </AdminShell>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import NuevaCotizacionForm from '@/components/admin/NuevaCotizacionForm';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?:          string;
    from_id?:       string;
    [key: string]:  string | undefined;
  }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  const params = await searchParams;

  // Si viene from_id, cargar la cotización completa desde la DB
  let initialData: Record<string, string> = {};
  let fromFolio = '';

  if (params.from_id) {
    const { data: cotiz } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', params.from_id)
      .maybeSingle();

    if (cotiz) {
      fromFolio = cotiz.codigo ?? '';
      initialData = {
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
        fromFolio,
      };
    }
  } else {
    // Sin from_id, usar params de URL (por si se linkea directamente)
    initialData = {
      cliente:        params.compania ?? '',
      nombreObra:     params.nombre_obra ?? '',
      email:          params.email ?? '',
      region:         params.region ?? '',
      tipoServicio:   params.tipo_servicio ?? '',
      contactoNombre: params.nombre ?? '',
      direccion:      params.direccion ?? '',
    };
  }

  return (
    <AdminShell session={session} active="cotizaciones">
      <NuevaCotizacionForm
        key={params.from_id ?? 'new'}
        tipo={params.tipo ?? ''}
        fromSolicitudId={params.from_id}
        initialData={initialData}
      />
    </AdminShell>
  );
}

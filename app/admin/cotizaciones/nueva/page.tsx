import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import NuevaCotizacionForm from '@/components/admin/NuevaCotizacionForm';

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
  let initialData: Record<string, string | undefined> = {};
  let fromFolio: string | undefined;

  if (params.from_id) {
    const { data: cotiz } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', params.from_id)
      .maybeSingle();

    console.log("[nueva] from_id:", params.from_id, "cotiz found:", !!cotiz, "keys:", cotiz ? Object.keys(cotiz).length : 0);
    if (cotiz) {
      fromFolio = cotiz.codigo ?? undefined;
      initialData = {
        cliente:        cotiz.compania ?? undefined,
        nombreObra:     cotiz.nombre_obra ?? undefined,
        email:          cotiz.email ?? undefined,
        region:         cotiz.region ?? undefined,
        tipoServicio:   cotiz.tipo_servicio ?? undefined,
        contactoNombre: [cotiz.nombre, cotiz.apellidos].filter(Boolean).join(' ') || undefined,
        direccion:      cotiz.direccion ?? undefined,
        telefono:       cotiz.telefono ?? undefined,
        movil:          cotiz.movil ?? undefined,
        rutEmpresa:     cotiz.rut_empresa ?? undefined,
        cargo:          cotiz.cargo ?? undefined,
        prioridad:      cotiz.prioridad ?? undefined,
        giro:           cotiz.giro ?? undefined,
        comuna:         cotiz.comuna ?? undefined,
        ciudad:         cotiz.ciudad ?? undefined,
        glosa:          cotiz.glosa ?? undefined,
        vendedor:       cotiz.vendedor ?? undefined,
        listaPrecio:    cotiz.lista_precio ?? undefined,
        observaciones:  cotiz.observaciones ?? undefined,
        nombreDir:      cotiz.nombre_dir ?? undefined,
        origen:         cotiz.origen ?? undefined,
        fromFolio,
      };
    }
  } else {
    // Sin from_id, usar params de URL (por si se linkea directamente)
    initialData = {
      cliente:        params.compania,
      nombreObra:     params.nombre_obra,
      email:          params.email,
      region:         params.region,
      tipoServicio:   params.tipo_servicio,
      contactoNombre: params.nombre,
      direccion:      params.direccion,
    };
  }

  return (
    <AdminShell session={session} active="cotizaciones">
      <NuevaCotizacionForm
        tipo={params.tipo ?? ''}
        fromSolicitudId={params.from_id}
        initialData={initialData}
      />
    </AdminShell>
  );
}

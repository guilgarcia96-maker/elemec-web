import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import AdminShell from '@/components/admin/AdminShell';
import NuevaCotizacionForm from '@/components/admin/NuevaCotizacionForm';

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?:          string;
    from_id?:       string;
    compania?:      string;
    nombre_obra?:   string;
    email?:         string;
    region?:        string;
    tipo_servicio?: string;
    nombre?:        string;
    direccion?:     string;
  }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  const params = await searchParams;

  return (
    <AdminShell session={session} active="cotizaciones">
      <NuevaCotizacionForm
        tipo={params.tipo ?? ''}
        fromSolicitudId={params.from_id}
        initialData={{
          cliente:        params.compania,
          nombreObra:     params.nombre_obra,
          email:          params.email,
          region:         params.region,
          tipoServicio:   params.tipo_servicio,
          contactoNombre: params.nombre,
          direccion:      params.direccion,
        }}
      />
    </AdminShell>
  );
}
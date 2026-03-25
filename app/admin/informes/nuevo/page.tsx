import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import InformeWizard from "@/components/admin/informes/InformeWizard";

export default async function NuevoInformePage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (!session) redirect("/admin/login");

  return (
    <AdminShell session={session} active="informes">
      <main className="px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Nuevo Informe Técnico</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los pasos para crear y emitir el informe.
          </p>
        </div>
        <InformeWizard />
      </main>
    </AdminShell>
  );
}

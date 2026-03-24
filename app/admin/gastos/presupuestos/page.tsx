import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import GastosPresupuestosClient from "@/components/admin/gastos/GastosPresupuestosClient";

export default async function GastosPresupuestosPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  return (
    <AdminShell session={session} active="gastos">
      <main className="px-3 py-4 md:px-6 md:py-10">
        <GastosPresupuestosClient />
      </main>
    </AdminShell>
  );
}

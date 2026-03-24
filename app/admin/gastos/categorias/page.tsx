import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import GastosCategoriasClient from "@/components/admin/gastos/GastosCategoriasClient";

export default async function GastosCategoriasPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  return (
    <AdminShell session={session} active="gastos">
      <main className="px-6 py-10">
        <GastosCategoriasClient />
      </main>
    </AdminShell>
  );
}

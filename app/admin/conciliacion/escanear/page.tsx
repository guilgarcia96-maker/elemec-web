import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import EscanearClient from "./EscanearClient";

export default async function EscanearPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  return (
    <AdminShell session={session} active="conciliacion">
      <EscanearClient />
    </AdminShell>
  );
}

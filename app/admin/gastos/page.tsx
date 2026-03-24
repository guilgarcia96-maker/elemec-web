import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import GastosDashboardCharts from "@/components/admin/gastos/GastosDashboardCharts";

export default async function GastosDashboardPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  return (
    <AdminShell session={session} active="gastos">
      <main className="px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Control de Gastos</h1>
            <p className="mt-1 text-sm text-white/50">
              Dashboard de egresos, presupuestos y tendencias
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/conciliacion/escanear"
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Escanear Recibo
            </Link>
            <Link
              href="/admin/gastos/lista"
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:border-white/40 hover:text-white"
            >
              Ver Lista
            </Link>
          </div>
        </div>

        {/* Acceso rapido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Link
            href="/admin/gastos/lista"
            className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/20 transition p-4"
          >
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition">Lista de Gastos</span>
            <span className="text-[10px] text-white/30">CRUD completo</span>
          </Link>
          <Link
            href="/admin/gastos/categorias"
            className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/20 transition p-4"
          >
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition">Categorias</span>
            <span className="text-[10px] text-white/30">Gestionar categorias</span>
          </Link>
          <Link
            href="/admin/gastos/presupuestos"
            className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/20 transition p-4"
          >
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition">Presupuestos</span>
            <span className="text-[10px] text-white/30">Limites por categoria</span>
          </Link>
          <Link
            href="/admin/conciliacion/escanear"
            className="group flex flex-col gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.04] hover:bg-orange-500/[0.08] hover:border-orange-500/30 transition p-4"
          >
            <span className="text-sm font-semibold text-orange-300/80 group-hover:text-orange-300 transition">Escanear Recibo</span>
            <span className="text-[10px] text-orange-300/30">OCR con IA</span>
          </Link>
        </div>

        {/* Charts */}
        <GastosDashboardCharts />
      </main>
    </AdminShell>
  );
}

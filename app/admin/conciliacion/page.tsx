import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import ConciliacionTableClient from "@/components/admin/ConciliacionTableClient";

const ESTADOS = ["pendiente", "conciliado", "observado"] as const;
const TIPOS    = ["ingreso", "egreso"] as const;
type Estado = (typeof ESTADOS)[number];
type Tipo   = (typeof TIPOS)[number];

function fmtCLP(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

async function getMovimientos(filtroEstado?: string, filtroTipo?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let query = supabase
    .from("conciliacion_movimientos")
    .select("*, conciliacion_adjuntos(id, storage_path)")
    .order("fecha", { ascending: false });

  if (filtroEstado && ESTADOS.includes(filtroEstado as Estado)) {
    query = query.eq("estado", filtroEstado);
  }
  if (filtroTipo && TIPOS.includes(filtroTipo as Tipo)) {
    query = query.eq("tipo", filtroTipo);
  }
  const { data, error } = await query;
  if (error) console.error(error);
  return data ?? [];
}

export default async function AdminConciliacionPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const filtroEstado = params.estado ?? "";
  const filtroTipo   = params.tipo   ?? "";

  const movimientos = await getMovimientos(filtroEstado, filtroTipo);

  // Resumen totales
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: todos } = await supabase
    .from("conciliacion_movimientos")
    .select("estado, tipo, monto");

  const totalPendiente  = (todos ?? []).filter((r) => r.estado === "pendiente").reduce((a, r) => a + Number(r.monto), 0);
  const totalConciliado = (todos ?? []).filter((r) => r.estado === "conciliado").reduce((a, r) => a + Number(r.monto), 0);
  const totalObservado  = (todos ?? []).filter((r) => r.estado === "observado").reduce((a, r) => a + Number(r.monto), 0);

  const canEdit = ["admin", "contabilidad"].includes(session.role);

  return (
    <AdminShell session={session} active="conciliacion">
      <main className="px-3 py-4 md:px-6 md:py-10">
        {/* Título */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Conciliación Contable</h1>
            <p className="mt-1 text-sm text-white/50">
              {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}
              {filtroEstado ? ` · ${filtroEstado}` : ""}
              {filtroTipo   ? ` · ${filtroTipo}`   : ""}
            </p>
          </div>
          {canEdit && (
            <Link
              href="/admin/conciliacion/nuevo"
              className="rounded-lg bg-[#e2b44b] px-4 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] transition"
            >
              + Nuevo movimiento
            </Link>
          )}
        </div>

        {/* Resumen tarjetas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Pendiente", value: totalPendiente,  color: "text-yellow-400" },
            { label: "Conciliado", value: totalConciliado, color: "text-green-400" },
            { label: "Observado",  value: totalObservado,  color: "text-red-400"   },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-widest text-white/40">{c.label}</p>
              <p className={`mt-2 text-xl font-bold ${c.color}`}>{fmtCLP(c.value)}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/conciliacion"
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              !filtroEstado && !filtroTipo
                ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                : "border-white/20 text-white/50 hover:border-white/40"
            }`}
          >
            Todos
          </Link>
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={`/admin/conciliacion?estado=${e}${filtroTipo ? `&tipo=${filtroTipo}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filtroEstado === e
                  ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </Link>
          ))}
          <span className="border-l border-white/10 mx-1" />
          {TIPOS.map((t) => (
            <Link
              key={t}
              href={`/admin/conciliacion?tipo=${t}${filtroEstado ? `&estado=${filtroEstado}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filtroTipo === t
                  ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </div>

        {/* Tabla */}
        <div className="mt-6">
          <ConciliacionTableClient movimientos={movimientos} canEdit={canEdit} />
        </div>
      </main>
    </AdminShell>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const ESTADOS = ["pendiente", "conciliado", "observado"] as const;
const TIPOS    = ["ingreso", "egreso"] as const;
type Estado = (typeof ESTADOS)[number];
type Tipo   = (typeof TIPOS)[number];

const BADGE_ESTADO: Record<Estado, string> = {
  pendiente:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  conciliado: "bg-green-500/20 text-green-300 border-green-500/40",
  observado:  "bg-red-500/20 text-red-300 border-red-500/40",
};

const BADGE_TIPO: Record<Tipo, string> = {
  ingreso: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  egreso:  "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

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
    .select("*")
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
      <main className="px-6 py-10">
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
        <div className="mt-6 grid grid-cols-3 gap-4">
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
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estado</th>
                {canEdit && <th className="px-4 py-3">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-4 py-10 text-center text-white/30">
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
              {movimientos.map((m: Record<string, string>) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                    {m.fecha}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        BADGE_TIPO[m.tipo as Tipo] ?? ""
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{m.categoria}</td>
                  <td className="px-4 py-3 text-white/70 max-w-xs truncate">
                    {m.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3 text-white/50 font-mono text-xs">
                    {m.referencia || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    {fmtCLP(Number(m.monto))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        BADGE_ESTADO[m.estado as Estado] ?? BADGE_ESTADO.pendiente
                      }`}
                    >
                      {m.estado}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <form action="/api/admin/conciliacion/estado" method="POST" className="flex gap-1">
                        <input type="hidden" name="id" value={m.id} />
                        {m.estado !== "conciliado" && (
                          <button
                            name="estado"
                            value="conciliado"
                            className="rounded border border-green-500/40 px-2 py-0.5 text-xs text-green-300 hover:bg-green-500/10 transition"
                          >
                            Conciliar
                          </button>
                        )}
                        {m.estado !== "observado" && (
                          <button
                            name="estado"
                            value="observado"
                            className="rounded border border-red-500/40 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/10 transition"
                          >
                            Observar
                          </button>
                        )}
                        {m.estado !== "pendiente" && (
                          <button
                            name="estado"
                            value="pendiente"
                            className="rounded border border-yellow-500/40 px-2 py-0.5 text-xs text-yellow-300 hover:bg-yellow-500/10 transition"
                          >
                            Pendiente
                          </button>
                        )}
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AdminShell>
  );
}

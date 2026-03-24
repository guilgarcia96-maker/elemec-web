import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [cotizaciones, postulaciones, aging, conciliacion] = await Promise.all([
    supabase.from("cotizaciones").select("id, codigo, estado, created_at, total, monto_estimado, nombre, apellidos, compania, fecha_validez").order("created_at", { ascending: false }),
    supabase.from("postulaciones").select("id, estado, nombre, cargo, created_at").order("created_at", { ascending: false }),
    supabase.from("v_cxc_aging").select("saldo, tramo_mora, razon_social, dias_mora").order("dias_mora", { ascending: false }),
    supabase.from("conciliacion_movimientos").select("id, estado, monto, tipo, fecha, descripcion").order("fecha", { ascending: false }),
  ]);

  return {
    cotizaciones: cotizaciones.data ?? [],
    postulaciones: postulaciones.data ?? [],
    aging: aging.data ?? [],
    conciliacion: conciliacion.data ?? [],
  };
}

const COT_ESTADOS = ["nueva", "en_revision", "cotizada", "ganada", "perdida"] as const;
type CotEstado = typeof COT_ESTADOS[number];
const COT_LABEL: Record<CotEstado, string> = {
  nueva: "Nueva", en_revision: "En revisión", cotizada: "Cotizada", ganada: "Ganada", perdida: "Perdida",
};
const COT_COLOR: Record<CotEstado, string> = {
  nueva: "bg-blue-500", en_revision: "bg-yellow-500", cotizada: "bg-purple-500", ganada: "bg-green-500", perdida: "bg-red-500",
};
const COT_TEXT: Record<CotEstado, string> = {
  nueva: "text-blue-300", en_revision: "text-yellow-300", cotizada: "text-purple-300", ganada: "text-green-300", perdida: "text-red-300",
};

const POST_ESTADOS = ["recibida", "en_revision", "entrevista", "aprobada", "rechazada", "contratada"] as const;
type PostEstado = typeof POST_ESTADOS[number];
const POST_LABEL: Record<PostEstado, string> = {
  recibida: "Recibida", en_revision: "En revisión", entrevista: "Entrevista",
  aprobada: "Aprobada", rechazada: "Rechazada", contratada: "Contratada",
};
const POST_COLOR: Record<PostEstado, string> = {
  recibida: "bg-blue-500", en_revision: "bg-yellow-500", entrevista: "bg-purple-500",
  aprobada: "bg-emerald-500", rechazada: "bg-red-500", contratada: "bg-green-500",
};
const POST_TEXT: Record<PostEstado, string> = {
  recibida: "text-blue-300", en_revision: "text-yellow-300", entrevista: "text-purple-300",
  aprobada: "text-emerald-300", rechazada: "text-red-300", contratada: "text-green-300",
};

const QUICK_LINKS = [
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: "📋", desc: "Solicitudes recibidas" },
  { href: "/admin/postulaciones", label: "Postulaciones", icon: "👤", desc: "Pipeline de RRHH" },
  { href: "/admin/conciliacion", label: "Conciliación", icon: "🏦", desc: "Movimientos contables" },
  { href: "/admin/cobranza", label: "Cobranza", icon: "💰", desc: "Aging CxC y mora" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️", desc: "Reglas y motor" },
];

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const { cotizaciones, postulaciones, aging, conciliacion } = await getDashboardData();

  // KPI: cotizaciones nuevas
  const cotNuevas = cotizaciones.filter((c) => c.estado === "nueva").length;

  // KPI: postulaciones pendientes (recibida + en_revision + entrevista)
  const postPendientes = postulaciones.filter(
    (p) => ["recibida", "en_revision", "entrevista"].includes(p.estado)
  ).length;

  // KPI: CxC total vencida (aging)
  const cxcVencida = aging.reduce((sum, r) => sum + (r.saldo ?? 0), 0);
  const cxcCritica = aging.filter((r) => r.tramo_mora === "90-180" || r.tramo_mora === "180+").length;

  // KPI: movimientos pendientes de conciliacion
  const concPendientes = conciliacion.filter((m) => m.estado === "pendiente").length;

  // KPI: Monto total en pipeline
  const montoPipeline = cotizaciones
    .filter((c) => ["nueva", "en_revision", "cotizada"].includes(c.estado))
    .reduce((sum, c) => sum + (c.total ?? c.monto_estimado ?? 0), 0);

  // KPI: Tasa de conversión
  const cotGanadas = cotizaciones.filter((c) => c.estado === "ganada").length;
  const cotPerdidas = cotizaciones.filter((c) => c.estado === "perdida").length;
  const totalCerradas = cotGanadas + cotPerdidas;
  const tasaConversion = totalCerradas > 0 ? (cotGanadas / totalCerradas) * 100 : 0;

  // KPI: Cotizaciones por vencer (fecha_validez < hoy + 7 días)
  const hoy = new Date();
  const en7dias = new Date(hoy);
  en7dias.setDate(en7dias.getDate() + 7);
  const cotPorVencer = cotizaciones.filter((c) => {
    if (!c.fecha_validez) return false;
    if (["ganada", "perdida"].includes(c.estado)) return false;
    const fv = new Date(c.fecha_validez);
    return fv <= en7dias && fv >= hoy;
  });

  // Pipeline cotizaciones
  const cotByEstado = COT_ESTADOS.map((e) => ({
    estado: e,
    count: cotizaciones.filter((c) => c.estado === e).length,
  }));
  const cotMax = Math.max(...cotByEstado.map((x) => x.count), 1);

  // Pipeline postulaciones
  const postByEstado = POST_ESTADOS.map((e) => ({
    estado: e,
    count: postulaciones.filter((p) => p.estado === e).length,
  }));
  const postMax = Math.max(...postByEstado.map((x) => x.count), 1);

  // Recientes
  const recientesCot = cotizaciones.slice(0, 5);
  const recientesPost = postulaciones.slice(0, 5);

  const now = new Date();

  return (
    <AdminShell session={session} active="dashboard">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Panel de Control</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {now.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            {session.nombre}
          </span>
        </div>

        {/* KPI Cards — inspired by KAME widget-reminder pattern */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cotizaciones nuevas */}
          <Link href="/admin/cotizaciones?estado=nueva" className="group block">
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 hover:bg-blue-500/12 transition p-5">
              <p className="text-xs text-blue-300/70 uppercase tracking-widest font-semibold">Cotizaciones Nuevas</p>
              <p className="text-4xl font-bold text-blue-200 mt-2 tabular-nums">{cotNuevas}</p>
              <p className="text-xs text-blue-300/50 mt-2">solicitudes sin gestionar</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-blue-300/60 group-hover:text-blue-200 transition">
                Ver todas →
              </div>
            </div>
          </Link>

          {/* Postulaciones pendientes */}
          <Link href="/admin/postulaciones" className="group block">
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/8 hover:bg-yellow-500/12 transition p-5">
              <p className="text-xs text-yellow-300/70 uppercase tracking-widest font-semibold">Postulaciones Activas</p>
              <p className="text-4xl font-bold text-yellow-200 mt-2 tabular-nums">{postPendientes}</p>
              <p className="text-xs text-yellow-300/50 mt-2">en pipeline de RRHH</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-yellow-300/60 group-hover:text-yellow-200 transition">
                Ver pipeline →
              </div>
            </div>
          </Link>

          {/* CxC total */}
          <Link href="/admin/cobranza" className="group block">
            <div className="rounded-xl border border-red-500/25 bg-red-500/8 hover:bg-red-500/12 transition p-5">
              <p className="text-xs text-red-300/70 uppercase tracking-widest font-semibold">CxC Vencidas</p>
              <p className="text-2xl font-bold text-red-200 mt-2 tabular-nums leading-tight">{CLP(cxcVencida)}</p>
              <p className="text-xs text-red-300/50 mt-2">{cxcCritica} facturas en mora crítica</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-red-300/60 group-hover:text-red-200 transition">
                Ver aging →
              </div>
            </div>
          </Link>

          {/* Conciliación pendiente */}
          <Link href="/admin/conciliacion?estado=pendiente" className="group block">
            <div className="rounded-xl border border-[#e2b44b]/25 bg-[#e2b44b]/8 hover:bg-[#e2b44b]/12 transition p-5">
              <p className="text-xs text-[#e2b44b]/70 uppercase tracking-widest font-semibold">Mov. Pendientes</p>
              <p className="text-4xl font-bold text-[#e2b44b] mt-2 tabular-nums">{concPendientes}</p>
              <p className="text-xs text-[#e2b44b]/50 mt-2">movimientos sin conciliar</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#e2b44b]/60 group-hover:text-[#e2b44b] transition">
                Ver conciliación →
              </div>
            </div>
          </Link>
        </div>

        {/* KPI Cards — Row 2: Pipeline, Conversión, Por vencer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monto en pipeline */}
          <Link href="/admin/cotizaciones" className="group block">
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/8 hover:bg-purple-500/12 transition p-5">
              <p className="text-xs text-purple-300/70 uppercase tracking-widest font-semibold">Pipeline Activo</p>
              <p className="text-2xl font-bold text-purple-200 mt-2 tabular-nums leading-tight">{CLP(montoPipeline)}</p>
              <p className="text-xs text-purple-300/50 mt-2">monto total en nueva + revisión + cotizada</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-300/60 group-hover:text-purple-200 transition">
                Ver pipeline →
              </div>
            </div>
          </Link>

          {/* Tasa de conversión */}
          <div className="rounded-xl border border-green-500/25 bg-green-500/8 p-5">
            <p className="text-xs text-green-300/70 uppercase tracking-widest font-semibold">Tasa de Conversión</p>
            <p className="text-4xl font-bold text-green-200 mt-2 tabular-nums">{tasaConversion.toFixed(1)}%</p>
            <p className="text-xs text-green-300/50 mt-2">
              {cotGanadas} ganadas de {totalCerradas} cerradas
            </p>
          </div>

          {/* Cotizaciones por vencer */}
          <Link href="/admin/cotizaciones" className="group block">
            <div className={`rounded-xl border transition p-5 ${
              cotPorVencer.length > 0
                ? "border-orange-500/25 bg-orange-500/8 hover:bg-orange-500/12"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}>
              <p className={`text-xs uppercase tracking-widest font-semibold ${
                cotPorVencer.length > 0 ? "text-orange-300/70" : "text-white/40"
              }`}>Por Vencer (7 días)</p>
              <p className={`text-4xl font-bold mt-2 tabular-nums ${
                cotPorVencer.length > 0 ? "text-orange-200" : "text-white/50"
              }`}>{cotPorVencer.length}</p>
              <p className={`text-xs mt-2 ${
                cotPorVencer.length > 0 ? "text-orange-300/50" : "text-white/30"
              }`}>cotizaciones con validez próxima a expirar</p>
              {cotPorVencer.length > 0 && (
                <div className="mt-4 flex items-center gap-1 text-xs text-orange-300/60 group-hover:text-orange-200 transition">
                  Revisar →
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Charts row — Pipeline visual (CSS bars, SSR-friendly) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cotizaciones Pipeline */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Pipeline de Cotizaciones</h2>
                <p className="text-xs text-white/35 mt-0.5">distribución por estado</p>
              </div>
              <Link href="/admin/cotizaciones" className="text-xs text-white/40 hover:text-white/80 transition">
                ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {cotByEstado.map(({ estado, count }) => (
                <Link
                  key={estado}
                  href={`/admin/cotizaciones?estado=${estado}`}
                  className="flex items-center gap-3 group hover:bg-white/[0.03] rounded-lg px-2 py-1.5 -mx-2 transition"
                >
                  <span className={`text-xs w-24 shrink-0 ${COT_TEXT[estado as CotEstado]}`}>
                    {COT_LABEL[estado as CotEstado]}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${COT_COLOR[estado as CotEstado]} opacity-70 transition-all`}
                      style={{ width: `${Math.max((count / cotMax) * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50 tabular-nums w-6 text-right">{count}</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-white/25 mt-4">Total: {cotizaciones.length} cotizaciones</p>
          </div>

          {/* Postulaciones Pipeline */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Pipeline de Postulaciones</h2>
                <p className="text-xs text-white/35 mt-0.5">distribución por etapa</p>
              </div>
              <Link href="/admin/postulaciones" className="text-xs text-white/40 hover:text-white/80 transition">
                ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {postByEstado.map(({ estado, count }) => (
                <Link
                  key={estado}
                  href={`/admin/postulaciones?estado=${estado}`}
                  className="flex items-center gap-3 group hover:bg-white/[0.03] rounded-lg px-2 py-1.5 -mx-2 transition"
                >
                  <span className={`text-xs w-24 shrink-0 ${POST_TEXT[estado as PostEstado]}`}>
                    {POST_LABEL[estado as PostEstado]}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${POST_COLOR[estado as PostEstado]} opacity-70 transition-all`}
                      style={{ width: `${Math.max((count / postMax) * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50 tabular-nums w-6 text-right">{count}</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-white/25 mt-4">Total: {postulaciones.length} postulaciones</p>
          </div>
        </div>

        {/* Recent Activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas cotizaciones */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Últimas Cotizaciones</h2>
              <Link href="/admin/cotizaciones" className="text-xs text-white/40 hover:text-white/80 transition">
                ver todas →
              </Link>
            </div>
            {recientesCot.length === 0 ? (
              <p className="text-xs text-white/30 py-4 text-center">Sin cotizaciones registradas</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recientesCot.map((c: { id: string; estado: string; created_at: string; codigo?: string; nombre?: string; apellidos?: string; compania?: string }) => (
                  <Link
                    key={c.id}
                    href={`/admin/cotizaciones/${c.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-white/[0.03] -mx-2 px-2 rounded transition"
                  >
                    <div className="truncate max-w-[180px]">
                      <span className="text-xs text-white/70">
                        {[c.nombre, c.apellidos].filter(Boolean).join(" ") || "Sin nombre"}
                      </span>
                      {c.compania && (
                        <span className="text-[10px] text-white/35 ml-1.5">{c.compania}</span>
                      )}
                    </div>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
                      c.estado === "nueva" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" :
                      c.estado === "ganada" ? "bg-green-500/20 text-green-300 border-green-500/40" :
                      c.estado === "perdida" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                      c.estado === "cotizada" ? "bg-purple-500/20 text-purple-300 border-purple-500/40" :
                      "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                    }`}>
                      {COT_LABEL[c.estado as CotEstado] ?? c.estado}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {new Date(c.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Últimas postulaciones */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Últimas Postulaciones</h2>
              <Link href="/admin/postulaciones" className="text-xs text-white/40 hover:text-white/80 transition">
                ver todas →
              </Link>
            </div>
            {recientesPost.length === 0 ? (
              <p className="text-xs text-white/30 py-4 text-center">Sin postulaciones registradas</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recientesPost.map((p: { id: string; estado: string; nombre?: string; cargo?: string; created_at: string }) => (
                  <Link
                    key={p.id}
                    href={`/admin/postulaciones/${p.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-white/[0.03] -mx-2 px-2 rounded transition"
                  >
                    <span className="text-xs text-white/70 truncate max-w-[140px]">
                      {p.nombre ?? "Sin nombre"}
                    </span>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
                      p.estado === "recibida" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" :
                      p.estado === "contratada" ? "bg-green-500/20 text-green-300 border-green-500/40" :
                      p.estado === "rechazada" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                      p.estado === "aprobada" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                      p.estado === "entrevista" ? "bg-purple-500/20 text-purple-300 border-purple-500/40" :
                      "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                    }`}>
                      {POST_LABEL[p.estado as PostEstado] ?? p.estado}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {new Date(p.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access — inspired by KAME informes/maestros buttons */}
        <div>
          <h2 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">Acceso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/20 transition p-4"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-sm font-semibold text-white/80 group-hover:text-white transition">{link.label}</span>
                <span className="text-[10px] text-white/30">{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mora crítica CxC (top 5) */}
        {aging.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Mora Crítica — CxC</h2>
                <p className="text-xs text-white/35 mt-0.5">facturas con mayor antigüedad</p>
              </div>
              <Link href="/admin/cobranza" className="text-xs text-red-400/60 hover:text-red-300 transition">
                ver aging completo →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 border-b border-white/8">
                    <th className="text-left pb-2 font-medium">Cliente</th>
                    <th className="text-right pb-2 font-medium">Saldo</th>
                    <th className="text-right pb-2 font-medium">Días mora</th>
                    <th className="text-right pb-2 font-medium">Tramo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aging.slice(0, 5).map((row: { razon_social?: string; saldo: number; dias_mora: number; tramo_mora: string }, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition">
                      <td className="py-2.5 text-white/70 truncate max-w-[180px]">{row.razon_social ?? "—"}</td>
                      <td className="py-2.5 text-right text-red-300 font-mono">{CLP(row.saldo)}</td>
                      <td className="py-2.5 text-right text-white/50">{row.dias_mora}d</td>
                      <td className="py-2.5 text-right">
                        <span className={`border rounded-full px-2 py-0.5 ${
                          row.tramo_mora === "180+" ? "bg-red-500/25 text-red-300 border-red-500/40" :
                          row.tramo_mora === "90-180" ? "bg-orange-500/25 text-orange-300 border-orange-500/40" :
                          row.tramo_mora === "31-90" ? "bg-yellow-500/25 text-yellow-300 border-yellow-500/40" :
                          "bg-blue-500/25 text-blue-300 border-blue-500/40"
                        }`}>
                          {row.tramo_mora}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

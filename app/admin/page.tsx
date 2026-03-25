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
  nueva: "text-blue-600", en_revision: "text-yellow-600", cotizada: "text-purple-600", ganada: "text-green-600", perdida: "text-red-600",
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
  recibida: "text-blue-600", en_revision: "text-yellow-600", entrevista: "text-purple-600",
  aprobada: "text-emerald-600", rechazada: "text-red-600", contratada: "text-green-600",
};

const QUICK_LINKS = [
  { href: "/admin/cotizaciones", label: "Cotizaciones", icon: "📋", desc: "Solicitudes recibidas" },
  { href: "/admin/postulaciones", label: "Postulaciones", icon: "👤", desc: "Pipeline de RRHH" },
  { href: "/admin/conciliacion", label: "Conciliación", icon: "🏦", desc: "Movimientos contables" },
  { href: "/admin/gastos", label: "Gastos", icon: "📊", desc: "Control de gastos y OCR" },
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

  // KPI: gastos del mes actual
  const _now = new Date();
  const mesActual = _now.getMonth(); // 0-indexed
  const anioActual = _now.getFullYear();
  const gastosDelMes = conciliacion
    .filter((m) => {
      if (m.tipo !== "egreso") return false;
      const f = new Date(m.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    })
    .reduce((sum, m) => sum + (m.monto ?? 0), 0);

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
      <div className="p-3 md:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {now.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
            {session.nombre}
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cotizaciones nuevas */}
          <Link href="/admin/cotizaciones?estado=nueva" className="group block">
            <div className="rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition p-5">
              <p className="text-xs text-blue-600 uppercase tracking-widest font-semibold">Cotizaciones Nuevas</p>
              <p className="text-4xl font-bold text-blue-700 mt-2 tabular-nums">{cotNuevas}</p>
              <p className="text-xs text-blue-500 mt-2">solicitudes sin gestionar</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-blue-500 group-hover:text-blue-700 transition">
                Ver todas →
              </div>
            </div>
          </Link>

          {/* Postulaciones pendientes */}
          <Link href="/admin/postulaciones" className="group block">
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition p-5">
              <p className="text-xs text-yellow-600 uppercase tracking-widest font-semibold">Postulaciones Activas</p>
              <p className="text-4xl font-bold text-yellow-700 mt-2 tabular-nums">{postPendientes}</p>
              <p className="text-xs text-yellow-500 mt-2">en pipeline de RRHH</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-yellow-500 group-hover:text-yellow-700 transition">
                Ver pipeline →
              </div>
            </div>
          </Link>

          {/* CxC total */}
          <Link href="/admin/cobranza" className="group block">
            <div className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition p-5">
              <p className="text-xs text-red-600 uppercase tracking-widest font-semibold">CxC Vencidas</p>
              <p className="text-2xl font-bold text-red-700 mt-2 tabular-nums leading-tight">{CLP(cxcVencida)}</p>
              <p className="text-xs text-red-500 mt-2">{cxcCritica} facturas en mora crítica</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-red-500 group-hover:text-red-700 transition">
                Ver aging →
              </div>
            </div>
          </Link>

          {/* Conciliación pendiente */}
          <Link href="/admin/conciliacion?estado=pendiente" className="group block">
            <div className="rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition p-5">
              <p className="text-xs text-orange-600 uppercase tracking-widest font-semibold">Mov. Pendientes</p>
              <p className="text-4xl font-bold text-orange-600 mt-2 tabular-nums">{concPendientes}</p>
              <p className="text-xs text-orange-500 mt-2">movimientos sin conciliar</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-orange-500 group-hover:text-orange-600 transition">
                Ver conciliación →
              </div>
            </div>
          </Link>
        </div>

        {/* KPI Cards — Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Gastos del mes */}
          <Link href="/admin/gastos" className="group block">
            <div className="rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition p-5">
              <p className="text-xs text-orange-600 uppercase tracking-widest font-semibold">Gastos del Mes</p>
              <p className="text-2xl font-bold text-orange-700 mt-2 tabular-nums leading-tight">{CLP(gastosDelMes)}</p>
              <p className="text-xs text-orange-500 mt-2">egresos registrados</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-orange-500 group-hover:text-orange-700 transition">
                Ver gastos →
              </div>
            </div>
          </Link>

          {/* Monto en pipeline */}
          <Link href="/admin/cotizaciones" className="group block">
            <div className="rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition p-5">
              <p className="text-xs text-purple-600 uppercase tracking-widest font-semibold">Pipeline Activo</p>
              <p className="text-2xl font-bold text-purple-700 mt-2 tabular-nums leading-tight">{CLP(montoPipeline)}</p>
              <p className="text-xs text-purple-500 mt-2">monto total en nueva + revisión + cotizada</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-purple-500 group-hover:text-purple-700 transition">
                Ver pipeline →
              </div>
            </div>
          </Link>

          {/* Tasa de conversión */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-xs text-green-600 uppercase tracking-widest font-semibold">Tasa de Conversión</p>
            <p className="text-4xl font-bold text-green-700 mt-2 tabular-nums">{tasaConversion.toFixed(1)}%</p>
            <p className="text-xs text-green-500 mt-2">
              {cotGanadas} ganadas de {totalCerradas} cerradas
            </p>
          </div>

          {/* Cotizaciones por vencer */}
          <Link href="/admin/cotizaciones" className="group block">
            <div className={`rounded-xl border transition p-5 ${
              cotPorVencer.length > 0
                ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            }`}>
              <p className={`text-xs uppercase tracking-widest font-semibold ${
                cotPorVencer.length > 0 ? "text-orange-600" : "text-gray-400"
              }`}>Por Vencer (7 días)</p>
              <p className={`text-4xl font-bold mt-2 tabular-nums ${
                cotPorVencer.length > 0 ? "text-orange-700" : "text-gray-500"
              }`}>{cotPorVencer.length}</p>
              <p className={`text-xs mt-2 ${
                cotPorVencer.length > 0 ? "text-orange-500" : "text-gray-400"
              }`}>cotizaciones con validez próxima a expirar</p>
              {cotPorVencer.length > 0 && (
                <div className="mt-4 flex items-center gap-1 text-xs text-orange-500 group-hover:text-orange-700 transition">
                  Revisar →
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Charts row — Pipeline visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cotizaciones Pipeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pipeline de Cotizaciones</h2>
                <p className="text-xs text-gray-400 mt-0.5">distribución por estado</p>
              </div>
              <Link href="/admin/cotizaciones" className="text-xs text-gray-400 hover:text-gray-700 transition">
                ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {cotByEstado.map(({ estado, count }) => (
                <Link
                  key={estado}
                  href={`/admin/cotizaciones?estado=${estado}`}
                  className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition"
                >
                  <span className={`text-xs w-24 shrink-0 ${COT_TEXT[estado as CotEstado]}`}>
                    {COT_LABEL[estado as CotEstado]}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${COT_COLOR[estado as CotEstado]} opacity-70 transition-all`}
                      style={{ width: `${Math.max((count / cotMax) * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums w-6 text-right">{count}</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Total: {cotizaciones.length} cotizaciones</p>
          </div>

          {/* Postulaciones Pipeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pipeline de Postulaciones</h2>
                <p className="text-xs text-gray-400 mt-0.5">distribución por etapa</p>
              </div>
              <Link href="/admin/postulaciones" className="text-xs text-gray-400 hover:text-gray-700 transition">
                ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {postByEstado.map(({ estado, count }) => (
                <Link
                  key={estado}
                  href={`/admin/postulaciones?estado=${estado}`}
                  className="flex items-center gap-3 group hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition"
                >
                  <span className={`text-xs w-24 shrink-0 ${POST_TEXT[estado as PostEstado]}`}>
                    {POST_LABEL[estado as PostEstado]}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${POST_COLOR[estado as PostEstado]} opacity-70 transition-all`}
                      style={{ width: `${Math.max((count / postMax) * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums w-6 text-right">{count}</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Total: {postulaciones.length} postulaciones</p>
          </div>
        </div>

        {/* Recent Activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas cotizaciones */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Últimas Cotizaciones</h2>
              <Link href="/admin/cotizaciones" className="text-xs text-gray-400 hover:text-gray-700 transition">
                ver todas →
              </Link>
            </div>
            {recientesCot.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Sin cotizaciones registradas</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recientesCot.map((c: { id: string; estado: string; created_at: string; codigo?: string; nombre?: string; apellidos?: string; compania?: string }) => (
                  <Link
                    key={c.id}
                    href={`/admin/cotizaciones/${c.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition"
                  >
                    <div className="truncate max-w-[180px]">
                      <span className="text-xs text-gray-600">
                        {[c.nombre, c.apellidos].filter(Boolean).join(" ") || "Sin nombre"}
                      </span>
                      {c.compania && (
                        <span className="text-[10px] text-gray-400 ml-1.5">{c.compania}</span>
                      )}
                    </div>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
                      c.estado === "nueva" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      c.estado === "ganada" ? "bg-green-100 text-green-700 border-green-200" :
                      c.estado === "perdida" ? "bg-red-100 text-red-700 border-red-200" :
                      c.estado === "cotizada" ? "bg-purple-100 text-purple-700 border-purple-200" :
                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}>
                      {COT_LABEL[c.estado as CotEstado] ?? c.estado}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Últimas postulaciones */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Últimas Postulaciones</h2>
              <Link href="/admin/postulaciones" className="text-xs text-gray-400 hover:text-gray-700 transition">
                ver todas →
              </Link>
            </div>
            {recientesPost.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Sin postulaciones registradas</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recientesPost.map((p: { id: string; estado: string; nombre?: string; cargo?: string; created_at: string }) => (
                  <Link
                    key={p.id}
                    href={`/admin/postulaciones/${p.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition"
                  >
                    <span className="text-xs text-gray-600 truncate max-w-[140px]">
                      {p.nombre ?? "Sin nombre"}
                    </span>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
                      p.estado === "recibida" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      p.estado === "contratada" ? "bg-green-100 text-green-700 border-green-200" :
                      p.estado === "rechazada" ? "bg-red-100 text-red-700 border-red-200" :
                      p.estado === "aprobada" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      p.estado === "entrevista" ? "bg-purple-100 text-purple-700 border-purple-200" :
                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                    }`}>
                      {POST_LABEL[p.estado as PostEstado] ?? p.estado}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(p.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Acceso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition p-4"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition">{link.label}</span>
                <span className="text-[10px] text-gray-400">{link.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mora crítica CxC (top 5) */}
        {aging.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Mora Crítica — CxC</h2>
                <p className="text-xs text-gray-400 mt-0.5">facturas con mayor antigüedad</p>
              </div>
              <Link href="/admin/cobranza" className="text-xs text-red-500 hover:text-red-700 transition">
                ver aging completo →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-red-200">
                    <th className="text-left pb-2 font-medium">Cliente</th>
                    <th className="text-right pb-2 font-medium">Saldo</th>
                    <th className="text-right pb-2 font-medium">Días mora</th>
                    <th className="text-right pb-2 font-medium">Tramo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {aging.slice(0, 5).map((row: { razon_social?: string; saldo: number; dias_mora: number; tramo_mora: string }, i) => (
                    <tr key={i} className="hover:bg-red-100/50 transition">
                      <td className="py-2.5 text-gray-600 truncate max-w-[180px]">{row.razon_social ?? "—"}</td>
                      <td className="py-2.5 text-right text-red-600 font-mono">{CLP(row.saldo)}</td>
                      <td className="py-2.5 text-right text-gray-500">{row.dias_mora}d</td>
                      <td className="py-2.5 text-right">
                        <span className={`border rounded-full px-2 py-0.5 ${
                          row.tramo_mora === "180+" ? "bg-red-100 text-red-700 border-red-200" :
                          row.tramo_mora === "90-180" ? "bg-orange-100 text-orange-700 border-orange-200" :
                          row.tramo_mora === "31-90" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                          "bg-blue-100 text-blue-700 border-blue-200"
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

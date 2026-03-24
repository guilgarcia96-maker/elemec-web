import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const ESTADOS = ["proceso", "nueva", "en_revision", "cotizada", "ganada", "perdida"] as const;
type Estado = (typeof ESTADOS)[number];

const BADGE: Record<Estado, string> = {
  proceso:     "bg-orange-500/20 text-orange-300 border-orange-500/40",
  nueva:       "bg-blue-500/20 text-blue-300 border-blue-500/40",
  en_revision: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  cotizada:    "bg-purple-500/20 text-purple-300 border-purple-500/40",
  ganada:      "bg-green-500/20 text-green-300 border-green-500/40",
  perdida:     "bg-red-500/20 text-red-300 border-red-500/40",
};

const LABEL: Record<Estado, string> = {
  proceso:     "En proceso",
  nueva:       "Nueva",
  en_revision: "En revisión",
  cotizada:    "Cotizada",
  ganada:      "Ganada",
  perdida:     "Perdida",
};

async function getCotizaciones(opts: {
  estado?: string;
  busqueda?: string;
  desde?: string;
  hasta?: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let query = supabase
    .from("cotizaciones")
    .select("id,codigo,nombre,apellidos,compania,email,tipo_servicio,region,estado,created_at,monto_estimado,prioridad,total,tipo_registro")
    .order("created_at", { ascending: false });

  if (opts.estado && ESTADOS.includes(opts.estado as Estado)) {
    query = query.eq("estado", opts.estado);
  }
  if (opts.busqueda) {
    const q = opts.busqueda.trim();
    query = query.or(
      `nombre.ilike.%${q}%,apellidos.ilike.%${q}%,email.ilike.%${q}%,compania.ilike.%${q}%,codigo.ilike.%${q}%`
    );
  }
  if (opts.desde) {
    query = query.gte("created_at", opts.desde);
  }
  if (opts.hasta) {
    // include the full end day
    const hastaEod = opts.hasta + "T23:59:59.999Z";
    query = query.lte("created_at", hastaEod);
  }

  const { data, error } = await query;
  if (error) console.error(error);
  return data ?? [];
}

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; busqueda?: string; desde?: string; hasta?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const filtroEstado = params.estado ?? "";
  const filtroBusqueda = params.busqueda ?? "";
  const filtroDesde = params.desde ?? "";
  const filtroHasta = params.hasta ?? "";

  const cotizaciones = await getCotizaciones({
    estado: filtroEstado,
    busqueda: filtroBusqueda,
    desde: filtroDesde,
    hasta: filtroHasta,
  });

  const hayFiltros = !!(filtroEstado || filtroBusqueda || filtroDesde || filtroHasta);

  const exportHref = `/api/admin/cotizaciones/export?${new URLSearchParams({
    ...(filtroEstado   && { estado:   filtroEstado }),
    ...(filtroBusqueda && { busqueda: filtroBusqueda }),
    ...(filtroDesde    && { desde:    filtroDesde }),
    ...(filtroHasta    && { hasta:    filtroHasta }),
  }).toString()}`;

  return (
    <AdminShell session={session} active="cotizaciones">
      <main className="px-6 py-10">
        {/* Título */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Solicitudes de cotización</h1>
            <p className="mt-1 text-sm text-white/50">
              {cotizaciones.length} registro{cotizaciones.length !== 1 ? "s" : ""}
              {hayFiltros ? " · con filtros aplicados" : ""}
            </p>
          </div>
        </div>

        {/* ── Botonera ─────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Nueva Cotización dropdown */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              NUEVA COTIZACIÓN
              <svg className="h-3 w-3 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
              <p className="border-b border-white/10 bg-blue-900/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-300">
                Documentos electrónicos
              </p>
              {[
                { tipo: "boleta_electronica",              label: "Boleta Electrónica" },
                { tipo: "boleta_exenta_electronica",       label: "Boleta Exenta Electrónica" },
                { tipo: "factura_exportacion_electronica", label: "Factura de Exportación Electrónica" },
                { tipo: "factura_electronica",             label: "Factura Electrónica" },
                { tipo: "factura_exenta_electronica",      label: "Factura Exenta Electrónica" },
              ].map(({ tipo, label }) => (
                <Link key={tipo} href={`/admin/cotizaciones/nueva?tipo=${tipo}`}
                  className="block px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
                  {label}
                </Link>
              ))}
              <p className="border-b border-t border-white/10 bg-blue-900/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-300">
                Documentos manuales
              </p>
              {[
                { tipo: "factura",        label: "Factura" },
                { tipo: "factura_exenta", label: "Factura Exenta" },
              ].map(({ tipo, label }) => (
                <Link key={tipo} href={`/admin/cotizaciones/nueva?tipo=${tipo}`}
                  className="block px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          </details>

          {/* Importar documentos */}
          <Link
            href="/admin/cotizaciones/importar"
            className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4m0 0l-4-4m4 4V4"/></svg>
            IMPORTAR DOCUMENTOS
          </Link>

          {/* Generar Excel (CSV) */}
          <a
            href={exportHref}
            className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4 4 4-4M12 4v12"/></svg>
            GENERAR EXCEL
          </a>
        </div>
        {/* ── Fin botonera ──────────────────────────────────────── */}

        {/* Panel de filtros (KAME-style) */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Filtro de cotizaciones
            </h3>
          </div>
          <form method="GET" className="p-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Fecha desde */}
              <div>
                <label className="mb-1 block text-xs text-white/50">Fecha desde</label>
                <input
                  type="date"
                  name="desde"
                  defaultValue={filtroDesde}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#e2b44b]"
                />
              </div>
              {/* Fecha hasta */}
              <div>
                <label className="mb-1 block text-xs text-white/50">Fecha hasta</label>
                <input
                  type="date"
                  name="hasta"
                  defaultValue={filtroHasta}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#e2b44b]"
                />
              </div>
              {/* Búsqueda */}
              <div>
                <label className="mb-1 block text-xs text-white/50">Cliente / empresa / email</label>
                <input
                  type="text"
                  name="busqueda"
                  defaultValue={filtroBusqueda}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#e2b44b]"
                />
              </div>
              {/* Estado */}
              <div>
                <label className="mb-1 block text-xs text-white/50">Estado</label>
                <select
                  name="estado"
                  defaultValue={filtroEstado}
                  className="w-full rounded-lg border border-white/15 bg-[#0f0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e2b44b]"
                >
                  <option value="">Todos</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{LABEL[e]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#c99d3a]"
              >
                Buscar
              </button>
              {hayFiltros && (
                <Link
                  href="/admin/cotizaciones"
                  className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/60 transition hover:border-white/40"
                >
                  Limpiar filtros
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Filtros rápidos de estado (pills) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/cotizaciones${filtroDesde || filtroHasta || filtroBusqueda ? "?" + new URLSearchParams({ ...(filtroDesde && { desde: filtroDesde }), ...(filtroHasta && { hasta: filtroHasta }), ...(filtroBusqueda && { busqueda: filtroBusqueda }) }).toString() : ""}`}
            className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
              !filtroEstado
                ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                : "border-white/20 text-white/50 hover:border-white/40"
            }`}
          >
            Todas
          </Link>
          {ESTADOS.map((e) => {
            const sp = new URLSearchParams({ estado: e, ...(filtroDesde && { desde: filtroDesde }), ...(filtroHasta && { hasta: filtroHasta }), ...(filtroBusqueda && { busqueda: filtroBusqueda }) });
            return (
              <Link
                key={e}
                href={`/admin/cotizaciones?${sp.toString()}`}
                className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                  filtroEstado === e
                    ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                    : "border-white/20 text-white/50 hover:border-white/40"
                }`}
              >
                {LABEL[e]}
              </Link>
            );
          })}
        </div>

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3 hidden md:table-cell">Región</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-white/30">
                    No hay cotizaciones{hayFiltros ? " que coincidan con los filtros" : " registradas"}.
                  </td>
                </tr>
              )}
              {cotizaciones.map((c: Record<string, unknown>) => (
                <tr
                  key={c.id as string}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 text-xs font-mono text-[#e2b44b] whitespace-nowrap">
                    {(c.codigo as string) || <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                    {new Date(c.created_at as string).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.nombre as string} {c.apellidos as string}</p>
                    <p className="text-xs text-white/40">{c.email as string}</p>
                  </td>
                  <td className="px-4 py-3 text-white/70">{(c.compania as string) || "—"}</td>
                  <td className="px-4 py-3 text-white/70 max-w-xs truncate">{(c.tipo_servicio as string) || "—"}</td>
                  <td className="px-4 py-3 text-white/70 hidden md:table-cell">{(c.region as string) || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70 whitespace-nowrap">
                    {c.total
                      ? `$${Number(c.total).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`
                      : c.monto_estimado
                        ? <span className="text-white/40">~${Number(c.monto_estimado).toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                        : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[c.estado as Estado] ?? BADGE.nueva}`}>
                      {LABEL[c.estado as Estado] ?? (c.estado as string)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      c.tipo_registro === "solicitud_cliente"
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-white/40"
                    }`}>
                      {c.tipo_registro === "solicitud_cliente" ? "Web" : "Backoffice"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cotizaciones/${c.id}`}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/60 hover:border-[#e2b44b] hover:text-[#e2b44b] transition"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AdminShell>
  );
}

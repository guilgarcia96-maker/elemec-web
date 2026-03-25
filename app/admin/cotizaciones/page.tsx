import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const ESTADOS = ["proceso", "nueva", "en_revision", "cotizada", "ganada", "perdida"] as const;
type Estado = (typeof ESTADOS)[number];

const BADGE: Record<Estado, string> = {
  proceso:     "bg-orange-100 text-orange-700 border-orange-200",
  nueva:       "bg-blue-100 text-blue-700 border-blue-200",
  en_revision: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cotizada:    "bg-purple-100 text-purple-700 border-purple-200",
  ganada:      "bg-green-100 text-green-700 border-green-200",
  perdida:     "bg-red-100 text-red-700 border-red-200",
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
      <main className="px-3 py-4 md:px-6 md:py-10">
        {/* Título */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Solicitudes de cotización</h1>
            <p className="mt-1 text-sm text-gray-500">
              {cotizaciones.length} registro{cotizaciones.length !== 1 ? "s" : ""}
              {hayFiltros ? " · con filtros aplicados" : ""}
            </p>
          </div>
        </div>

        {/* Botonera */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Nueva Cotización dropdown */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-green-600 px-2 md:px-4 py-2 text-xs md:text-sm font-semibold text-white transition hover:bg-green-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              NUEVA COTIZACIÓN
              <svg className="h-3 w-3 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <p className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
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
                  className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
                  {label}
                </Link>
              ))}
              <p className="border-b border-t border-gray-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
                Documentos manuales
              </p>
              {[
                { tipo: "factura",        label: "Factura" },
                { tipo: "factura_exenta", label: "Factura Exenta" },
              ].map(({ tipo, label }) => (
                <Link key={tipo} href={`/admin/cotizaciones/nueva?tipo=${tipo}`}
                  className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
                  {label}
                </Link>
              ))}
            </div>
          </details>

          {/* Importar documentos */}
          <Link
            href="/admin/cotizaciones/importar"
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-2 md:px-4 py-2 text-xs md:text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4m0 0l-4-4m4 4V4"/></svg>
            IMPORTAR DOCUMENTOS
          </Link>

          {/* Generar Excel (CSV) */}
          <a
            href={exportHref}
            className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-2 md:px-4 py-2 text-xs md:text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4 4 4-4M12 4v12"/></svg>
            GENERAR EXCEL
          </a>
        </div>

        {/* Panel de filtros */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Filtro de cotizaciones
            </h3>
          </div>
          <form method="GET" className="p-5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Fecha desde</label>
                <input
                  type="date"
                  name="desde"
                  defaultValue={filtroDesde}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Fecha hasta</label>
                <input
                  type="date"
                  name="hasta"
                  defaultValue={filtroHasta}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Cliente / empresa / email</label>
                <input
                  type="text"
                  name="busqueda"
                  defaultValue={filtroBusqueda}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Estado</label>
                <select
                  name="estado"
                  defaultValue={filtroEstado}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Buscar
              </button>
              {hayFiltros && (
                <Link
                  href="/admin/cotizaciones"
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-500 transition hover:border-gray-400"
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
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-gray-300 text-gray-500 hover:border-gray-400"
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
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-300 text-gray-500 hover:border-gray-400"
                }`}
              >
                {LABEL[e]}
              </Link>
            );
          })}
        </div>

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 hidden md:table-cell">Empresa</th>
                <th className="px-4 py-3 hidden md:table-cell">Servicio</th>
                <th className="px-4 py-3 hidden md:table-cell">Región</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 hidden md:table-cell">Origen</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                    No hay cotizaciones{hayFiltros ? " que coincidan con los filtros" : " registradas"}.
                  </td>
                </tr>
              )}
              {cotizaciones.map((c: Record<string, unknown>) => (
                <tr
                  key={c.id as string}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-xs font-mono text-orange-500 whitespace-nowrap">
                    {(c.codigo as string) || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell">
                    {new Date(c.created_at as string).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{c.nombre as string} {c.apellidos as string}</p>
                    <p className="text-xs text-gray-400">{c.email as string}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{(c.compania as string) || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate hidden md:table-cell">{(c.tipo_servicio as string) || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{(c.region as string) || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600 whitespace-nowrap hidden md:table-cell">
                    {c.total
                      ? `$${Number(c.total).toLocaleString("es-CL", { maximumFractionDigits: 0 })}`
                      : c.monto_estimado
                        ? <span className="text-gray-400">~${Number(c.monto_estimado).toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[c.estado as Estado] ?? BADGE.nueva}`}>
                      {LABEL[c.estado as Estado] ?? (c.estado as string)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      c.tipo_registro === "solicitud_cliente"
                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}>
                      {c.tipo_registro === "solicitud_cliente" ? "Web" : "Backoffice"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/cotizaciones/${c.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-orange-500 hover:text-orange-500 transition"
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

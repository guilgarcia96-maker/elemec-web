import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const ESTADOS = ["borrador", "emitido", "aprobado", "archivado"] as const;
type Estado = (typeof ESTADOS)[number];

const BADGE: Record<Estado, string> = {
  borrador:  "bg-gray-100 text-gray-700 border-gray-200",
  emitido:   "bg-blue-100 text-blue-700 border-blue-200",
  aprobado:  "bg-green-100 text-green-700 border-green-200",
  archivado: "bg-purple-100 text-purple-700 border-purple-200",
};

const LABEL: Record<Estado, string> = {
  borrador:  "Borrador",
  emitido:   "Emitido",
  aprobado:  "Aprobado",
  archivado: "Archivado",
};

const SERVICIOS = [
  "Mantenimiento",
  "Instalacion",
  "Reparacion",
  "Inspeccion",
  "Montaje",
  "Desmontaje",
  "Asesoria",
  "Otro",
];

async function getInformes(opts: {
  estado?: string;
  servicio_tipo?: string;
  busqueda?: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let query = supabase
    .from("informes")
    .select("id,codigo,titulo,servicio_tipo,obra,cliente_nombre,cliente_empresa,estado,fecha_trabajo,created_at")
    .order("created_at", { ascending: false });

  if (opts.estado && ESTADOS.includes(opts.estado as Estado)) {
    query = query.eq("estado", opts.estado);
  }
  if (opts.servicio_tipo) {
    query = query.eq("servicio_tipo", opts.servicio_tipo);
  }
  if (opts.busqueda) {
    const q = opts.busqueda.trim();
    query = query.or(
      `titulo.ilike.%${q}%,obra.ilike.%${q}%,cliente_nombre.ilike.%${q}%,cliente_empresa.ilike.%${q}%,codigo.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) console.error(error);
  return data ?? [];
}

export default async function AdminInformesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; servicio_tipo?: string; busqueda?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const filtroEstado = params.estado ?? "";
  const filtroServicio = params.servicio_tipo ?? "";
  const filtroBusqueda = params.busqueda ?? "";

  const informes = await getInformes({
    estado: filtroEstado,
    servicio_tipo: filtroServicio,
    busqueda: filtroBusqueda,
  });

  const hayFiltros = !!(filtroEstado || filtroServicio || filtroBusqueda);

  return (
    <AdminShell session={session} active="informes">
      <main className="px-3 py-4 md:px-6 md:py-10">
        {/* Titulo */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Informes Tecnicos</h1>
            <p className="mt-1 text-sm text-gray-500">
              {informes.length} registro{informes.length !== 1 ? "s" : ""}
              {hayFiltros ? " · con filtros aplicados" : ""}
            </p>
          </div>
          <Link
            href="/admin/informes/nuevo"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo informe
          </Link>
        </div>

        {/* Panel de filtros */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Filtros
            </h3>
          </div>
          <form method="GET" className="p-5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Buscar</label>
                <input
                  type="text"
                  name="busqueda"
                  defaultValue={filtroBusqueda}
                  placeholder="Titulo, obra, cliente..."
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
              <div>
                <label className="mb-1 block text-xs text-gray-500">Tipo de servicio</label>
                <select
                  name="servicio_tipo"
                  defaultValue={filtroServicio}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Todos</option>
                  {SERVICIOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
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
                  href="/admin/informes"
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-500 transition hover:border-gray-400"
                >
                  Limpiar filtros
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Filtros rapidos de estado */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/informes${filtroBusqueda || filtroServicio ? "?" + new URLSearchParams({ ...(filtroBusqueda && { busqueda: filtroBusqueda }), ...(filtroServicio && { servicio_tipo: filtroServicio }) }).toString() : ""}`}
            className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
              !filtroEstado
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-gray-300 text-gray-500 hover:border-gray-400"
            }`}
          >
            Todos
          </Link>
          {ESTADOS.map((e) => {
            const sp = new URLSearchParams({
              estado: e,
              ...(filtroBusqueda && { busqueda: filtroBusqueda }),
              ...(filtroServicio && { servicio_tipo: filtroServicio }),
            });
            return (
              <Link
                key={e}
                href={`/admin/informes?${sp.toString()}`}
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
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3 hidden md:table-cell">Servicio</th>
                <th className="px-4 py-3 hidden md:table-cell">Cliente / Obra</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {informes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No hay informes{hayFiltros ? " que coincidan con los filtros" : " registrados"}.
                  </td>
                </tr>
              )}
              {informes.map((inf: Record<string, unknown>) => (
                <tr
                  key={inf.id as string}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-xs font-mono text-orange-500 whitespace-nowrap">
                    {(inf.codigo as string) || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-xs truncate">
                    {(inf.titulo as string) || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {(inf.servicio_tipo as string) || "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-900">{(inf.cliente_empresa as string) || (inf.cliente_nombre as string) || "—"}</p>
                    {inf.obra ? <p className="text-xs text-gray-400">{inf.obra as string}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[inf.estado as Estado] ?? BADGE.borrador}`}>
                      {LABEL[inf.estado as Estado] ?? (inf.estado as string)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden md:table-cell">
                    {inf.fecha_trabajo
                      ? new Date(inf.fecha_trabajo as string).toLocaleDateString("es-CL")
                      : new Date(inf.created_at as string).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/informes/${inf.id}`}
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

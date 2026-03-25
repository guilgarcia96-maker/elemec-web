import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import CotizacionAdjuntosForm from "@/components/admin/CotizacionAdjuntosForm";
import CotizacionAdjuntoActions from "@/components/admin/CotizacionAdjuntoActions";
import CotizacionAdjuntoPreview from "@/components/admin/CotizacionAdjuntoPreview";
import AdminShell from "@/components/admin/AdminShell";
import EstadoConfirmDialog from "@/components/admin/EstadoConfirmDialog";
import CotizacionEditForm from "@/components/admin/CotizacionEditForm";
import CotizacionDeleteButton from "@/components/admin/CotizacionDeleteButton";

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

const CAMPOS: { key: string; label: string }[] = [
  { key: "codigo",        label: "Folio / Código" },
  { key: "tipo_documento",label: "Tipo de documento" },
  { key: "tipo_registro", label: "Origen registro" },
  { key: "fecha_inicio",  label: "Fecha" },
  { key: "fecha_cierre_estimada", label: "Fecha vigencia" },
  { key: "sucursal",      label: "Sucursal" },
  { key: "compania",      label: "Compañía / Cliente" },
  { key: "nombre",        label: "Contacto" },
  { key: "apellidos",     label: "Apellidos" },
  { key: "rut_empresa",   label: "RUT Empresa" },
  { key: "cargo",         label: "Cargo" },
  { key: "email",         label: "Email" },
  { key: "movil",         label: "Móvil" },
  { key: "telefono",      label: "Teléfono" },
  { key: "giro",          label: "Giro" },
  { key: "direccion",     label: "Dirección" },
  { key: "comuna",        label: "Comuna" },
  { key: "ciudad",        label: "Ciudad" },
  { key: "region",        label: "Región" },
  { key: "nombre_dir",    label: "Nombre dirección" },
  { key: "nombre_obra",   label: "Obra / Proyecto" },
  { key: "tipo_obra",     label: "Tipo de obra" },
  { key: "tipo_servicio", label: "Tipo de servicio" },
  { key: "prioridad",     label: "Prioridad" },
  { key: "origen",        label: "Origen" },
  { key: "canal",         label: "Canal" },
  { key: "glosa",         label: "Glosa" },
  { key: "vendedor",      label: "Vendedor" },
  { key: "lista_precio",  label: "Lista de precios" },
  { key: "moneda",        label: "Moneda" },
  { key: "subtotal",      label: "Subtotal" },
  { key: "descuentos",    label: "Descuentos" },
  { key: "impuestos",     label: "Impuestos" },
  { key: "total",         label: "Total" },
  { key: "condicion_venta", label: "Condición de venta" },
  { key: "fecha_vencimiento",label: "Fecha vencimiento" },
  { key: "fecha_validez", label: "Fecha validez" },
  { key: "margen_estimado", label: "Margen estimado %" },
  { key: "probabilidad_cierre", label: "Probabilidad cierre %" },
  { key: "motivo_perdida", label: "Motivo pérdida" },
  { key: "observaciones", label: "Observaciones" },
  { key: "comentarios",   label: "Comentarios" },
  { key: "notas_internas", label: "Notas internas" },
];

export default async function DetalleCotizacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const sp = await searchParams;
  const canDeleteAttachments = ["admin", "ventas", "operaciones"].includes(session.role);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  const { data: attachmentRows, error: attachmentError } = await supabase
    .from("cotizacion_adjuntos")
    .select("id, nombre_archivo, storage_path, created_at, subido_por")
    .eq("cotizacion_id", id)
    .order("created_at", { ascending: false });

  const { data: versionRows } = await supabase
    .from("cotizacion_versiones")
    .select("id, version_num, total, subtotal, descuentos, impuestos, estado, moneda, condiciones_comerciales, notas_internas, json_snapshot, created_at, created_by")
    .eq("cotizacion_id", id)
    .order("version_num", { ascending: false });

  const selectedVersionNum = sp.version ? parseInt(sp.version) : null;
  const activeVersion = selectedVersionNum
    ? versionRows?.find((v) => v.version_num === selectedVersionNum) ?? versionRows?.[0] ?? null
    : versionRows?.[0] ?? null;

  const { data: itemRows } = activeVersion
    ? await supabase
        .from("cotizacion_items")
        .select("id, item_num, descripcion, unidad, cantidad, precio_unitario, descuento_pct, tipo_impuesto, impuesto_pct, subtotal, total")
        .eq("cotizacion_version_id", activeVersion.id)
        .order("item_num")
    : { data: [] };

  const items = itemRows ?? [];

  const { data: aprobacionRows } = activeVersion
    ? await supabase
        .from("cotizacion_aprobaciones")
        .select("id, nivel, estado, aprobado_at, comentario")
        .eq("cotizacion_version_id", activeVersion.id)
        .order("nivel")
    : { data: [] };

  const aprobaciones = aprobacionRows ?? [];

  const { data: derivadasRows } = await supabase
    .from("cotizaciones")
    .select("id, codigo, estado, total, created_at")
    .eq("solicitud_id", id)
    .order("created_at", { ascending: false });

  const derivadas = derivadasRows ?? [];

  if (!cotizacion) notFound();

  const attachments = attachmentError ? [] : (attachmentRows ?? []);

  const adjuntosCliente = attachments.filter((a) => !a.subido_por);
  const adjuntosInternos = attachments.filter((a) => !!a.subido_por);

  const montoActual: number = activeVersion?.total ?? cotizacion.monto_estimado ?? cotizacion.total ?? 0;
  const requiereAprobacion = montoActual > 50_000_000;
  const pendingApproval = aprobaciones.find((a) => a.estado === "pendiente");
  const isAdmin = session.role === "admin";

  const desarrollarHref = `/admin/cotizaciones/nueva?from_id=${cotizacion.id}`;

  const hasMultipleVersions = (versionRows?.length ?? 0) > 1;

  return (
    <AdminShell session={session} active="cotizaciones">
      <main className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <Link href="/admin/cotizaciones" className="text-xs text-gray-400 hover:text-gray-900 transition">
            ← Cotizaciones
          </Link>
        </div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {cotizacion.codigo && (
              <p className="text-xs font-mono text-orange-500 mb-1">{cotizacion.codigo}</p>
            )}
            <h1 className="text-2xl font-bold">
              {cotizacion.nombre} {cotizacion.apellidos}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {cotizacion.compania && <span>{cotizacion.compania} · </span>}
              Recibida el {new Date(cotizacion.created_at).toLocaleDateString("es-CL")}
              {cotizacion.tipo_registro && (
                <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  cotizacion.tipo_registro === "solicitud_cliente"
                    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}>
                  {cotizacion.tipo_registro === "solicitud_cliente" ? "Web" : "Backoffice"}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${BADGE[cotizacion.estado as Estado] ?? BADGE.nueva}`}>
              {LABEL[cotizacion.estado as Estado] ?? cotizacion.estado}
            </span>
            <CotizacionEditForm cotizacionId={cotizacion.id} cotizacion={cotizacion} />
            {isAdmin && cotizacion.estado === "proceso" && (
              <CotizacionDeleteButton cotizacionId={cotizacion.id} codigo={cotizacion.codigo} />
            )}
          </div>
        </div>

        <EstadoConfirmDialog cotizacionId={cotizacion.id} estadoActual={cotizacion.estado} />

        {/* Generar cotización formal */}
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-orange-700">Generar cotización formal</h2>
              <p className="mt-1 text-xs text-gray-500">
                Desarrolla esta solicitud con items, precios y folio oficial. Puedes generar múltiples cotizaciones por solicitud.
              </p>
            </div>
            <Link
              href={desarrollarHref}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Desarrollar cotización
            </Link>
          </div>
        </div>

        {/* Cotizaciones derivadas */}
        {derivadas.length > 0 && (
          <section className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-5">
            <h2 className="text-sm font-semibold text-purple-700 mb-3">Cotizaciones derivadas</h2>
            <div className="space-y-2">
              {derivadas.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/cotizaciones/${d.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-orange-500">{d.codigo ?? d.id.slice(0, 8)}</span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE[d.estado as Estado] ?? BADGE.nueva}`}>
                      {LABEL[d.estado as Estado] ?? d.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {d.total && (
                      <span className="font-mono text-xs text-gray-500">
                        ${Number(d.total).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(d.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Datos de la cotización */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {CAMPOS.map(({ key, label }) =>
                cotizacion[key] ? (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-semibold text-gray-400 w-44 align-top whitespace-nowrap">
                      {label}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-pre-wrap">
                      {key === "email" ? (
                        <a href={`mailto:${cotizacion[key]}`} className="text-orange-500 underline">
                          {cotizacion[key]}
                        </a>
                      ) : (
                        cotizacion[key]
                      )}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>

        {/* Selector de versiones */}
        {hasMultipleVersions && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Historial de versiones</h2>
            <div className="space-y-2">
              {versionRows!.map((v) => {
                const isActive = v.id === activeVersion?.id;
                return (
                  <Link
                    key={v.id}
                    href={`/admin/cotizaciones/${id}?version=${v.version_num}`}
                    className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition ${
                      isActive
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs ${isActive ? "text-orange-500" : "text-gray-500"}`}>
                        v{v.version_num}
                      </span>
                      {v.estado && (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE[v.estado as Estado] ?? "border-gray-200 bg-gray-50 text-gray-500"}`}>
                          {LABEL[v.estado as Estado] ?? v.estado}
                        </span>
                      )}
                      {v.created_at && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(v.created_at).toLocaleDateString("es-CL")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {v.total != null && (
                        <span className="font-mono text-xs text-gray-500">
                          ${Number(v.total).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {isActive && (
                        <span className="rounded border border-orange-300 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-500">
                          Seleccionada
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Items de la versión activa */}
        {items.length > 0 && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Detalle de items
                {activeVersion && <span className="ml-2 text-xs text-gray-400 font-mono">Version {activeVersion.version_num}</span>}
              </h2>
              {activeVersion && (
                <span className="text-xs text-gray-400">
                  {activeVersion.moneda ?? "CLP"}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-2 w-10">#</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2 text-right w-20">Cant.</th>
                    <th className="px-4 py-2 w-16">U.M.</th>
                    <th className="px-4 py-2 text-right w-28">P. Unit.</th>
                    <th className="px-4 py-2 text-right w-20">Desc.%</th>
                    <th className="px-4 py-2 w-20">Imp.</th>
                    <th className="px-4 py-2 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-400">{item.item_num as number}</td>
                      <td className="px-4 py-2 text-gray-700">{item.descripcion as string}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">{Number(item.cantidad)}</td>
                      <td className="px-4 py-2 text-gray-500">{(item.unidad as string) || "UN"}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">
                        ${Number(item.precio_unitario).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500">
                        {Number(item.descuento_pct) > 0 ? `${item.descuento_pct}%` : "\u2014"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          item.tipo_impuesto === "exenta"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}>
                          {item.tipo_impuesto === "exenta" ? "Exenta" : `${item.impuesto_pct ?? 19}%`}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-gray-700">
                        ${Number(item.total).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeVersion && (
              <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-mono">${Number(activeVersion.subtotal ?? 0).toLocaleString("es-CL", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(activeVersion.descuentos ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Descuentos</span>
                      <span className="font-mono">-${Number(activeVersion.descuentos).toLocaleString("es-CL", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Impuestos</span>
                    <span className="font-mono">${Number(activeVersion.impuestos ?? 0).toLocaleString("es-CL", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-orange-500">
                    <span>Total</span>
                    <span className="font-mono">${Number(activeVersion.total ?? 0).toLocaleString("es-CL", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Notas internas */}
        <form action="/api/admin/cotizaciones/notas" method="POST" className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <input type="hidden" name="id" value={cotizacion.id} />
          <label className="mb-2 block text-sm font-semibold text-gray-600">
            Notas internas
          </label>
          <textarea
            name="notas_internas"
            rows={4}
            defaultValue={cotizacion.notas_internas ?? ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400"
            placeholder="Agrega observaciones, seguimiento, comentarios internos..."
          />
          <button
            type="submit"
            className="mt-3 rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 transition"
          >
            Guardar notas
          </button>
        </form>

        {/* Aprobación de cotización */}
        {(requiereAprobacion || aprobaciones.length > 0) && (
          <section className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-orange-600">Flujo de aprobación</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {requiereAprobacion
                    ? `Monto > 50MM CLP — requiere aprobación de Administrador.`
                    : "Registro de aprobaciones de esta versión."}
                </p>
              </div>
              {activeVersion && (
                <span className="text-xs text-gray-400 font-mono">
                  Version {activeVersion.version_num}
                </span>
              )}
            </div>

            {aprobaciones.length > 0 && (
              <div className="mt-4 space-y-2">
                {aprobaciones.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-gray-600">Nivel {a.nivel}</span>
                      {a.comentario && (
                        <p className="mt-0.5 text-xs text-gray-400">{a.comentario}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.aprobado_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(a.aprobado_at).toLocaleDateString("es-CL")}
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          a.estado === "aprobada"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : a.estado === "rechazada"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {a.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAdmin && activeVersion && (pendingApproval || aprobaciones.length === 0) && (
              <form
                action="/api/admin/cotizaciones/aprobar"
                method="POST"
                className="mt-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                <input type="hidden" name="cotizacion_version_id" value={activeVersion.id} />
                <input type="hidden" name="nivel" value={pendingApproval?.nivel ?? 1} />
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <p className="mb-3 text-xs font-semibold text-gray-500">Decisión de aprobación</p>
                <textarea
                  name="comentario"
                  rows={2}
                  placeholder="Comentario opcional..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 mb-3"
                />
                <div className="flex gap-3">
                  <button
                    name="decision"
                    value="aprobada"
                    type="submit"
                    className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 transition"
                  >
                    Aprobar
                  </button>
                  <button
                    name="decision"
                    value="rechazada"
                    type="submit"
                    className="rounded-lg bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
                  >
                    Rechazar
                  </button>
                </div>
              </form>
            )}

            {!activeVersion && (
              <p className="mt-3 text-xs text-gray-400">
                Crea una versión de cotización para activar el flujo de aprobación.
              </p>
            )}
          </section>
        )}

        <CotizacionAdjuntosForm cotizacionId={cotizacion.id} />

        {/* Archivos del cliente */}
        <section className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-cyan-700">Archivos del cliente</h2>
              <p className="mt-1 text-xs text-gray-400">
                Documentos adjuntados por el cliente al enviar la solicitud.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {adjuntosCliente.length === 0 && (
              <p className="text-sm text-gray-400">
                El cliente no adjuntó archivos.
              </p>
            )}
            {adjuntosCliente.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-lg border border-cyan-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CotizacionAdjuntoPreview
                    adjunto={attachment}
                    openHref={`/api/admin/cotizaciones/adjuntos/${attachment.id}`}
                    storagePath={attachment.storage_path ?? null}
                  />
                  <span className="inline-flex rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700">
                    Cliente
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{attachment.nombre_archivo}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(attachment.created_at).toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
                <CotizacionAdjuntoActions
                  adjuntoId={attachment.id}
                  openHref={`/api/admin/cotizaciones/adjuntos/${attachment.id}`}
                  canDelete={canDeleteAttachments}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Documentos internos */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Documentos internos</h2>
              <p className="mt-1 text-xs text-gray-400">
                Contratos, propuestas, anexos, informes y respaldos subidos por el equipo.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {adjuntosInternos.length === 0 && (
              <p className="text-sm text-gray-400">
                Sin documentos internos adjuntos.
              </p>
            )}
            {adjuntosInternos.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CotizacionAdjuntoPreview
                    adjunto={attachment}
                    openHref={`/api/admin/cotizaciones/adjuntos/${attachment.id}`}
                    storagePath={attachment.storage_path ?? null}
                  />
                  <span className="inline-flex rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    Interno
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{attachment.nombre_archivo}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(attachment.created_at).toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
                <CotizacionAdjuntoActions
                  adjuntoId={attachment.id}
                  openHref={`/api/admin/cotizaciones/adjuntos/${attachment.id}`}
                  canDelete={canDeleteAttachments}
                />
              </div>
            ))}
          </div>
        </section>

      </main>
    </AdminShell>
  );
}

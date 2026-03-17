import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import CotizacionAdjuntosForm from "@/components/admin/CotizacionAdjuntosForm";
import CotizacionAdjuntoActions from "@/components/admin/CotizacionAdjuntoActions";
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

const CAMPOS: { key: string; label: string }[] = [
  { key: "codigo",        label: "Folio / Código" },
  { key: "tipo_documento",label: "Tipo de documento" },
  { key: "fecha_inicio",  label: "Fecha" },
  { key: "fecha_cierre_estimada", label: "Fecha vigencia" },
  { key: "sucursal",      label: "Sucursal" },
  // Cliente
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
  // Proyecto
  { key: "nombre_obra",   label: "Obra / Proyecto" },
  { key: "tipo_obra",     label: "Tipo de obra" },
  { key: "tipo_servicio", label: "Tipo de servicio" },
  { key: "prioridad",     label: "Prioridad" },
  { key: "origen",        label: "Origen" },
  // Comercial
  { key: "glosa",         label: "Glosa" },
  { key: "vendedor",      label: "Vendedor" },
  { key: "lista_precio",  label: "Lista de precios" },
  { key: "moneda",        label: "Moneda" },
  { key: "subtotal",      label: "Subtotal" },
  { key: "impuestos",     label: "Impuestos" },
  { key: "total",         label: "Total" },
  { key: "condicion_venta", label: "Condición de venta" },
  { key: "fecha_vencimiento",label: "Fecha vencimiento" },
  // Notas
  { key: "observaciones", label: "Observaciones" },
  { key: "comentarios",   label: "Comentarios" },
];

export default async function DetalleCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
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
    .select("id, nombre_archivo, created_at")
    .eq("cotizacion_id", id)
    .order("created_at", { ascending: false });

  // Versiones y aprobaciones (consolidated schema)
  const { data: versionRows } = await supabase
    .from("cotizacion_versiones")
    .select("id, version_num, total, estado")
    .eq("cotizacion_id", id)
    .order("version_num", { ascending: false });

  const latestVersion = versionRows?.[0] ?? null;

  const { data: aprobacionRows } = latestVersion
    ? await supabase
        .from("cotizacion_aprobaciones")
        .select("id, nivel, estado, aprobado_at, comentario")
        .eq("cotizacion_version_id", latestVersion.id)
        .order("nivel")
    : { data: [] };

  const aprobaciones = aprobacionRows ?? [];

  if (!cotizacion) notFound();

  const attachments = attachmentError ? [] : (attachmentRows ?? []);

  // Determine if approval is required (rule: > 50MM CLP)
  const montoActual: number = latestVersion?.total ?? cotizacion.monto_estimado ?? cotizacion.total ?? 0;
  const requiereAprobacion = montoActual > 50_000_000;
  const pendingApproval = aprobaciones.find((a) => a.estado === "pendiente");
  const isAdmin = session.role === "admin";

  // Build URL for pre-populating the nueva cotización form from this solicitud
  const desarrollarParams: Record<string, string> = { from_id: cotizacion.id };
  if (cotizacion.compania)      desarrollarParams.compania      = cotizacion.compania;
  if (cotizacion.nombre_obra)   desarrollarParams.nombre_obra   = cotizacion.nombre_obra;
  if (cotizacion.email)         desarrollarParams.email         = cotizacion.email;
  if (cotizacion.region)        desarrollarParams.region        = cotizacion.region;
  if (cotizacion.tipo_servicio) desarrollarParams.tipo_servicio = cotizacion.tipo_servicio;
  if (cotizacion.direccion)     desarrollarParams.direccion     = cotizacion.direccion;
  const nombreCompleto = [cotizacion.nombre, cotizacion.apellidos].filter(Boolean).join(" ");
  if (nombreCompleto) desarrollarParams.nombre = nombreCompleto;
  const desarrollarHref = "/admin/cotizaciones/nueva?" + new URLSearchParams(desarrollarParams).toString();

  return (
    <AdminShell session={session} active="cotizaciones">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link href="/admin/cotizaciones" className="text-xs text-white/40 hover:text-white transition">
            ← Cotizaciones
          </Link>
        </div>
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {cotizacion.nombre} {cotizacion.apellidos}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {cotizacion.compania && <span>{cotizacion.compania} · </span>}
              Recibida el {new Date(cotizacion.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${BADGE[cotizacion.estado as Estado] ?? BADGE.nueva}`}>
            {LABEL[cotizacion.estado as Estado] ?? cotizacion.estado}
          </span>
        </div>

        {/* Cambiar estado */}
        <form action="/api/admin/cotizaciones/estado" method="POST" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <input type="hidden" name="id" value={cotizacion.id} />
          <p className="mb-3 text-sm font-semibold text-white/70">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                name="estado"
                value={e}
                type="submit"
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  cotizacion.estado === e
                    ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                    : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                {LABEL[e]}
              </button>
            ))}
          </div>
        </form>

        {/* Generar cotización formal */}
        <div className="mt-6 rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-orange-300">Generar cotización formal</h2>
              <p className="mt-1 text-xs text-white/40">
                Desarrolla esta solicitud con ítems, precios y folio oficial. Puedes generar múltiples cotizaciones por solicitud.
              </p>
            </div>
            <Link
              href={desarrollarHref}
              className="flex items-center gap-2 rounded-lg bg-orange-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Desarrollar cotización
            </Link>
          </div>
        </div>

        {/* Datos de la cotización */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {CAMPOS.map(({ key, label }) =>
                cotizacion[key] ? (
                  <tr key={key} className="border-b border-white/5">
                    <td className="px-5 py-3 font-semibold text-white/40 w-44 align-top whitespace-nowrap">
                      {label}
                    </td>
                    <td className="px-5 py-3 text-white/80 whitespace-pre-wrap">
                      {key === "email" ? (
                        <a href={`mailto:${cotizacion[key]}`} className="text-[#e2b44b] underline">
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

        {/* Notas internas */}
        <form action="/api/admin/cotizaciones/notas" method="POST" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <input type="hidden" name="id" value={cotizacion.id} />
          <label className="mb-2 block text-sm font-semibold text-white/70">
            Notas internas
          </label>
          <textarea
            name="notas"
            rows={4}
            defaultValue={cotizacion.notas ?? ""}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
            placeholder="Agrega observaciones, seguimiento, comentarios internos..."
          />
          <button
            type="submit"
            className="mt-3 rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] transition"
          >
            Guardar notas
          </button>
        </form>

        {/* Aprobación de cotización */}
        {(requiereAprobacion || aprobaciones.length > 0) && (
          <section className="mt-6 rounded-xl border border-[#e2b44b]/30 bg-[#e2b44b]/5 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-[#e2b44b]">Flujo de aprobación</h2>
                <p className="mt-1 text-xs text-white/40">
                  {requiereAprobacion
                    ? `Monto > 50MM CLP — requiere aprobación de Administrador.`
                    : "Registro de aprobaciones de esta versión."}
                </p>
              </div>
              {latestVersion && (
                <span className="text-xs text-white/35 font-mono">
                  Versión {latestVersion.version_num}
                </span>
              )}
            </div>

            {/* Estado de aprobaciones existentes */}
            {aprobaciones.length > 0 && (
              <div className="mt-4 space-y-2">
                {aprobaciones.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-white/70">Nivel {a.nivel}</span>
                      {a.comentario && (
                        <p className="mt-0.5 text-xs text-white/40">{a.comentario}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.aprobado_at && (
                        <span className="text-xs text-white/30">
                          {new Date(a.aprobado_at).toLocaleDateString("es-CL")}
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          a.estado === "aprobada"
                            ? "border-green-500/40 bg-green-500/10 text-green-300"
                            : a.estado === "rechazada"
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                        }`}
                      >
                        {a.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin: approve/reject form */}
            {isAdmin && latestVersion && (pendingApproval || aprobaciones.length === 0) && (
              <form
                action="/api/admin/cotizaciones/aprobar"
                method="POST"
                className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <input type="hidden" name="cotizacion_version_id" value={latestVersion.id} />
                <input type="hidden" name="nivel" value={pendingApproval?.nivel ?? 1} />
                <input type="hidden" name="cotizacion_id" value={cotizacion.id} />
                <p className="mb-3 text-xs font-semibold text-white/60">Decisión de aprobación</p>
                <textarea
                  name="comentario"
                  rows={2}
                  placeholder="Comentario opcional..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30 mb-3"
                />
                <div className="flex gap-3">
                  <button
                    name="decision"
                    value="aprobada"
                    type="submit"
                    className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-500 transition"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    name="decision"
                    value="rechazada"
                    type="submit"
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </form>
            )}

            {!latestVersion && (
              <p className="mt-3 text-xs text-white/30">
                Crea una versión de cotización para activar el flujo de aprobación.
              </p>
            )}
          </section>
        )}

        <CotizacionAdjuntosForm cotizacionId={cotizacion.id} />

        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Documentos asociados</h2>
              <p className="mt-1 text-xs text-white/35">
                Contratos, propuestas, anexos, informes, imágenes o respaldos internos.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {attachments.length === 0 && (
              <p className="text-sm text-white/35">
                Todavía no hay adjuntos o la extensión de backoffice aún no se ejecuta en la base.
              </p>
            )}
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white/85">{attachment.nombre_archivo}</p>
                  <p className="text-xs text-white/35">
                    {new Date(attachment.created_at).toLocaleString("es-CL")}
                  </p>
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

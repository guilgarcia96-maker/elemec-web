import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import CambiarEstadoButton from "@/components/admin/informes/CambiarEstadoButton";
import EnviarClienteButton from "@/components/admin/informes/EnviarClienteButton";
import FotoGaleria from "@/components/admin/informes/FotoGaleria";

type Estado = "borrador" | "emitido" | "aprobado" | "archivado";

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

const SERVICIO_BADGE =
  "inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700";

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL");
}

export default async function InformeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: informe, error } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !informe) notFound();

  // Adjuntos
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  // Responsable
  let responsableNombre = "—";
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsableNombre = user?.nombre ?? "—";
  }

  // URLs firmadas para fotos (en paralelo)
  const adjuntosImagen = (adjuntos ?? []).filter(
    (adj) => adj.storage_path && adj.mime_type?.startsWith("image/"),
  );
  const signedResults = await Promise.all(
    adjuntosImagen.map((adj) =>
      supabase.storage
        .from(adj.storage_bucket ?? "backoffice-docs")
        .createSignedUrl(adj.storage_path, 3600)
        .then(({ data: signed }) => ({
          descripcion: adj.descripcion_ai || "",
          url: signed?.signedUrl ?? "",
          nombre: adj.nombre_archivo || "",
        })),
    ),
  );
  const fotosConUrl = signedResults.filter((f) => f.url);

  // Secciones de contenido — soporta formato nuevo (array) y legacy (objeto plano)
  const contenidoRaw = (informe.contenido_json ?? {}) as Record<string, unknown>;

  type SeccionRender = { titulo: string; contenido: string };
  let seccionesRender: SeccionRender[] = [];

  if (Array.isArray(contenidoRaw.secciones)) {
    seccionesRender = (contenidoRaw.secciones as Array<Record<string, unknown>>)
      .filter((s) => s.visible !== false && typeof s.contenido === "string" && (s.contenido as string).trim())
      .sort((a, b) => ((a.orden as number) ?? 0) - ((b.orden as number) ?? 0))
      .map((s) => ({
        titulo: (s.titulo as string) ?? "Sección",
        contenido: s.contenido as string,
      }));
  } else {
    const SECCIONES_COMPAT = [
      { key: "resumen_ejecutivo",   label: "Resumen Ejecutivo" },
      { key: "alcance",             label: "Alcance" },
      { key: "descripcion_trabajos", label: "Descripción de Trabajos" },
      { key: "hallazgos",           label: "Hallazgos" },
      { key: "conclusiones",        label: "Conclusiones" },
      { key: "recomendaciones",     label: "Recomendaciones" },
    ];
    seccionesRender = SECCIONES_COMPAT.filter(
      (s) => typeof contenidoRaw[s.key] === "string" && (contenidoRaw[s.key] as string).trim(),
    ).map((s) => ({ titulo: s.label, contenido: contenidoRaw[s.key] as string }));
  }

  const estado = (informe.estado ?? "borrador") as Estado;
  const badgeCls = BADGE[estado] ?? BADGE.borrador;
  const estadoLabel = LABEL[estado] ?? estado;

  return (
    <AdminShell session={session} active="informes">
      <main className="px-3 py-4 md:px-6 md:py-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-2 flex flex-wrap items-start gap-3">
          <Link
            href="/admin/informes"
            className="mt-0.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 transition"
          >
            ← Volver
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {informe.codigo && (
                <span className="font-mono text-sm font-bold text-orange-500">
                  {informe.codigo}
                </span>
              )}
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}>
                {estadoLabel}
              </span>
              {informe.servicio_tipo && (
                <span className={SERVICIO_BADGE}>
                  {informe.servicio_tipo}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight">
              {informe.titulo || "Sin título"}
            </h1>
          </div>
        </div>

        {/* ── Acciones ────────────────────────────────────────────── */}
        <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/informes/${id}/editar`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Editar
          </Link>
          <a
            href={`/api/admin/informes/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Generar PDF
          </a>
          <CambiarEstadoButton informeId={id} estadoActual={estado} />
          {(estado === "emitido" || estado === "aprobado") && (
            <EnviarClienteButton
              informeId={id}
              clienteEmail={informe.cliente_email ?? undefined}
            />
          )}
        </div>

        {/* ── Datos del proyecto ───────────────────────────────────── */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Datos del Proyecto
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {[
              { label: "Tipo de Servicio", value: informe.servicio_tipo },
              { label: "Obra / Proyecto",  value: informe.obra },
              { label: "Ubicación",        value: informe.ubicacion },
              { label: "Fecha del Trabajo", value: fmtDate(informe.fecha_trabajo) },
              { label: "Cliente",          value: informe.cliente_nombre },
              { label: "Empresa",          value: informe.cliente_empresa },
              { label: "Responsable",      value: responsableNombre },
              { label: "Creado",           value: fmtDate(informe.created_at) },
            ].map((row, i) => (
              <div key={i} className="flex border-b border-gray-100 px-5 py-3">
                <span className="w-36 shrink-0 text-xs font-medium text-gray-400">
                  {row.label}
                </span>
                <span className="text-sm text-gray-900">{row.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contenido del informe ────────────────────────────────── */}
        {seccionesRender.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Contenido del Informe
              </h3>
            </div>
            <div className="px-5 py-5 space-y-6">
              {seccionesRender.map((s, i) => (
                <div key={i}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
                    {s.titulo}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {s.contenido}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Galería de fotos ─────────────────────────────────────── */}
        {fotosConUrl.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Registro Fotográfico ({fotosConUrl.length})
              </h3>
            </div>
            <FotoGaleria fotos={fotosConUrl} />
          </div>
        )}

      </main>
    </AdminShell>
  );
}

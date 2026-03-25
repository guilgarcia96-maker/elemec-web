import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const BADGE: Record<string, string> = {
  borrador:  "bg-gray-100 text-gray-700 border-gray-200",
  emitido:   "bg-blue-100 text-blue-700 border-blue-200",
  aprobado:  "bg-green-100 text-green-700 border-green-200",
  archivado: "bg-purple-100 text-purple-700 border-purple-200",
};

const LABEL: Record<string, string> = {
  borrador:  "Borrador",
  emitido:   "Emitido",
  aprobado:  "Aprobado",
  archivado: "Archivado",
};

const SECCIONES: { key: string; label: string }[] = [
  { key: "resumen_ejecutivo", label: "Resumen Ejecutivo" },
  { key: "alcance", label: "Alcance" },
  { key: "descripcion_trabajos", label: "Descripcion de Trabajos" },
  { key: "hallazgos", label: "Hallazgos" },
  { key: "conclusiones", label: "Conclusiones" },
  { key: "recomendaciones", label: "Recomendaciones" },
];

export default async function InformeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Obtener informe
  const { data: informe, error } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !informe) notFound();

  // Obtener adjuntos
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  // Obtener responsable
  let responsableNombre = "—";
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsableNombre = user?.nombre ?? "—";
  }

  // URLs firmadas para fotos
  const fotosConUrl: { descripcion: string; url: string; nombre: string }[] = [];
  for (const adj of adjuntos ?? []) {
    if (adj.storage_path && adj.mime_type?.startsWith("image/")) {
      const { data: signed } = await supabase.storage
        .from(adj.storage_bucket ?? "backoffice-docs")
        .createSignedUrl(adj.storage_path, 3600);
      if (signed?.signedUrl) {
        fotosConUrl.push({
          descripcion: adj.descripcion_ai || "",
          url: signed.signedUrl,
          nombre: adj.nombre_archivo || "",
        });
      }
    }
  }

  const contenido = (informe.contenido_json ?? {}) as Record<string, string>;
  const estado = informe.estado as string;

  function fmtDate(iso?: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CL");
  }

  return (
    <AdminShell session={session} active="informes">
      <main className="px-3 py-4 md:px-6 md:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/informes"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 transition"
          >
            &larr; Volver
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{informe.titulo || "Sin titulo"}</h1>
            <p className="mt-1 text-sm text-gray-400 font-mono">
              {informe.codigo || "Sin folio"}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${BADGE[estado] ?? BADGE.borrador}`}>
            {LABEL[estado] ?? estado}
          </span>
        </div>

        {/* Acciones */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/informes/nuevo?editar=${id}`}
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
        </div>

        {/* Datos del proyecto */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Datos del Proyecto
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {[
              { label: "Tipo de Servicio", value: informe.servicio_tipo },
              { label: "Obra / Proyecto", value: informe.obra },
              { label: "Ubicacion", value: informe.ubicacion },
              { label: "Fecha del Trabajo", value: fmtDate(informe.fecha_trabajo) },
              { label: "Cliente", value: informe.cliente_nombre },
              { label: "Empresa", value: informe.cliente_empresa },
              { label: "Responsable", value: responsableNombre },
              { label: "Creado", value: fmtDate(informe.created_at) },
            ].map((row, i) => (
              <div key={i} className="flex border-b border-gray-100 px-5 py-3">
                <span className="w-36 shrink-0 text-xs font-medium text-gray-400">{row.label}</span>
                <span className="text-sm text-gray-900">{row.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secciones de contenido */}
        {SECCIONES.some((s) => contenido[s.key]?.trim()) && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Contenido del Informe
              </h3>
            </div>
            <div className="px-5 py-5 space-y-6">
              {SECCIONES.filter((s) => contenido[s.key]?.trim()).map((s) => (
                <div key={s.key}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
                    {s.label}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {contenido[s.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Galeria de fotos */}
        {fotosConUrl.length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Registro Fotografico ({fotosConUrl.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {fotosConUrl.map((foto, i) => (
                <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt={foto.nombre || `Foto ${i + 1}`}
                    className="h-56 w-full object-cover"
                  />
                  {foto.descripcion && (
                    <div className="px-3 py-2">
                      <p className="text-xs font-bold text-gray-400 mb-1">Foto {i + 1}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{foto.descripcion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

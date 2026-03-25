import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

const ESTADOS = [
  "recibida",
  "en_revision",
  "entrevista",
  "aprobada",
  "rechazada",
  "contratada",
] as const;
type Estado = (typeof ESTADOS)[number];

const BADGE: Record<Estado, string> = {
  recibida:    "bg-blue-100 text-blue-700 border-blue-200",
  en_revision: "bg-yellow-100 text-yellow-700 border-yellow-200",
  entrevista:  "bg-purple-100 text-purple-700 border-purple-200",
  aprobada:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  rechazada:   "bg-red-100 text-red-700 border-red-200",
  contratada:  "bg-green-100 text-green-700 border-green-200",
};

const LABEL: Record<Estado, string> = {
  recibida:    "Recibida",
  en_revision: "En revisión",
  entrevista:  "Entrevista",
  aprobada:    "Aprobada",
  rechazada:   "Rechazada",
  contratada:  "Contratada",
};

const CAMPOS: { key: string; label: string }[] = [
  { key: "nombre",           label: "Nombre" },
  { key: "apellidos",        label: "Apellidos" },
  { key: "email",            label: "Email" },
  { key: "telefono",         label: "Teléfono" },
  { key: "cargo_postulado",  label: "Cargo postulado" },
  { key: "area",             label: "Área" },
  { key: "experiencia_anos", label: "Años de experiencia" },
  { key: "disponibilidad",   label: "Disponibilidad" },
  { key: "ciudad",           label: "Ciudad" },
  { key: "region",           label: "Región" },
  { key: "resumen",          label: "Resumen / Extracto" },
];

export default async function DetallePostulacionPage({
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: postulacion } = await supabase
    .from("postulaciones")
    .select("*")
    .eq("id", id)
    .single();

  const { data: adjuntosRows } = await supabase
    .from("postulacion_adjuntos")
    .select("id, nombre_archivo, tipo, created_at")
    .eq("postulacion_id", id)
    .order("created_at", { ascending: false });

  if (!postulacion) notFound();

  const adjuntos = adjuntosRows ?? [];
  const canEdit = ["admin", "rrhh", "operaciones"].includes(session.role);

  return (
    <AdminShell session={session} active="postulaciones">
      <main className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <Link href="/admin/postulaciones" className="text-xs text-gray-400 hover:text-gray-900 transition">
            ← Postulaciones
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {postulacion.nombre} {postulacion.apellidos}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {postulacion.cargo_postulado && (
                <span>{postulacion.cargo_postulado} · </span>
              )}
              Recibida el{" "}
              {new Date(postulacion.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
              BADGE[postulacion.estado as Estado] ?? BADGE.recibida
            }`}
          >
            {LABEL[postulacion.estado as Estado] ?? postulacion.estado}
          </span>
        </div>

        {/* Cambiar estado */}
        {canEdit && (
          <form
            action="/api/admin/postulaciones/estado"
            method="POST"
            className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <input type="hidden" name="id" value={postulacion.id} />
            <p className="mb-3 text-sm font-semibold text-gray-500">
              Avanzar en el pipeline
            </p>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  name="estado"
                  value={e}
                  type="submit"
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    postulacion.estado === e
                      ? "border-orange-500 bg-orange-50 text-orange-500"
                      : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {LABEL[e]}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Datos del candidato */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Datos del candidato</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {CAMPOS.map(({ key, label }) =>
                postulacion[key] ? (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-semibold text-gray-400 w-48 align-top whitespace-nowrap">
                      {label}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-pre-wrap">
                      {key === "email" ? (
                        <a
                          href={`mailto:${postulacion[key]}`}
                          className="text-orange-500 underline"
                        >
                          {postulacion[key]}
                        </a>
                      ) : (
                        postulacion[key]
                      )}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>

        {/* Notas internas */}
        {canEdit && (
          <form
            action="/api/admin/postulaciones/notas"
            method="POST"
            className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <input type="hidden" name="id" value={postulacion.id} />
            <label className="mb-2 block text-sm font-semibold text-gray-500">
              Notas internas
            </label>
            <textarea
              name="notas"
              rows={4}
              defaultValue={postulacion.notas ?? ""}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
              placeholder="Evaluación, observaciones, seguimiento del proceso..."
            />
            <button
              type="submit"
              className="mt-3 rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 transition"
            >
              Guardar notas
            </button>
          </form>
        )}

        {/* Adjuntos (CV, otros) */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Documentos adjuntos</h2>
          <p className="text-xs text-gray-300 mb-4">CV, cartas de presentación, certificados.</p>

          {adjuntos.length === 0 ? (
            <p className="text-sm text-gray-300">Sin adjuntos registrados.</p>
          ) : (
            <div className="space-y-2">
              {adjuntos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-700">{a.nombre_archivo}</p>
                    <p className="text-xs text-gray-300">
                      {a.tipo?.toUpperCase()} ·{" "}
                      {new Date(a.created_at).toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  );
}

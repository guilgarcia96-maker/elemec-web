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
  recibida:    "bg-blue-500/20 text-blue-300 border-blue-500/40",
  en_revision: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  entrevista:  "bg-purple-500/20 text-purple-300 border-purple-500/40",
  aprobada:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rechazada:   "bg-red-500/20 text-red-300 border-red-500/40",
  contratada:  "bg-green-500/20 text-green-300 border-green-500/40",
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
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link href="/admin/postulaciones" className="text-xs text-white/40 hover:text-white transition">
            ← Postulaciones
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {postulacion.nombre} {postulacion.apellidos}
            </h1>
            <p className="mt-1 text-sm text-white/50">
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
            className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <input type="hidden" name="id" value={postulacion.id} />
            <p className="mb-3 text-sm font-semibold text-white/70">
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
                      ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                      : "border-white/20 text-white/50 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {LABEL[e]}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Datos del candidato */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white/80">Datos del candidato</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {CAMPOS.map(({ key, label }) =>
                postulacion[key] ? (
                  <tr key={key} className="border-b border-white/5">
                    <td className="px-5 py-3 font-semibold text-white/40 w-48 align-top whitespace-nowrap">
                      {label}
                    </td>
                    <td className="px-5 py-3 text-white/80 whitespace-pre-wrap">
                      {key === "email" ? (
                        <a
                          href={`mailto:${postulacion[key]}`}
                          className="text-[#e2b44b] underline"
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
            className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <input type="hidden" name="id" value={postulacion.id} />
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Notas internas
            </label>
            <textarea
              name="notas"
              rows={4}
              defaultValue={postulacion.notas ?? ""}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
              placeholder="Evaluación, observaciones, seguimiento del proceso..."
            />
            <button
              type="submit"
              className="mt-3 rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] transition"
            >
              Guardar notas
            </button>
          </form>
        )}

        {/* Adjuntos (CV, otros) */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-1">Documentos adjuntos</h2>
          <p className="text-xs text-white/35 mb-4">CV, cartas de presentación, certificados.</p>

          {adjuntos.length === 0 ? (
            <p className="text-sm text-white/30">Sin adjuntos registrados.</p>
          ) : (
            <div className="space-y-2">
              {adjuntos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white/85">{a.nombre_archivo}</p>
                    <p className="text-xs text-white/35">
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

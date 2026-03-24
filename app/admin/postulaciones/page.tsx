import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  recibida:   "bg-blue-500/20 text-blue-300 border-blue-500/40",
  en_revision:"bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  entrevista: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  aprobada:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rechazada:  "bg-red-500/20 text-red-300 border-red-500/40",
  contratada: "bg-green-500/20 text-green-300 border-green-500/40",
};

const LABEL: Record<Estado, string> = {
  recibida:   "Recibida",
  en_revision:"En revisión",
  entrevista: "Entrevista",
  aprobada:   "Aprobada",
  rechazada:  "Rechazada",
  contratada: "Contratada",
};

async function getPostulaciones(filtroEstado?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let query = supabase
    .from("postulaciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (filtroEstado && ESTADOS.includes(filtroEstado as Estado)) {
    query = query.eq("estado", filtroEstado);
  }

  const { data, error } = await query;
  if (error) console.error(error);
  return data ?? [];
}

export default async function AdminPostulacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const filtroEstado = params.estado ?? "";
  const postulaciones = await getPostulaciones(filtroEstado);

  // Conteos por estado para el pipeline header
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: conteos } = await supabase
    .from("postulaciones")
    .select("estado");
  const counts = (conteos ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.estado] = (acc[r.estado] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminShell session={session} active="postulaciones">
      <main className="px-3 py-4 md:px-6 md:py-10">
        {/* Título */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pipeline de Postulaciones</h1>
            <p className="mt-1 text-sm text-white/50">
              {postulaciones.length} candidato{postulaciones.length !== 1 ? "s" : ""}
              {filtroEstado ? ` · filtro: ${LABEL[filtroEstado as Estado] ?? filtroEstado}` : ""}
            </p>
          </div>
        </div>

        {/* Pipeline cards */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={filtroEstado === e ? "/admin/postulaciones" : `/admin/postulaciones?estado=${e}`}
              className={`rounded-xl border p-3 text-center transition ${
                filtroEstado === e
                  ? "border-[#e2b44b] bg-[#e2b44b]/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p className={`text-2xl font-bold ${filtroEstado === e ? "text-[#e2b44b]" : "text-white"}`}>
                {counts[e] ?? 0}
              </p>
              <p className={`mt-1 text-[10px] uppercase tracking-wider ${filtroEstado === e ? "text-[#e2b44b]/70" : "text-white/40"}`}>
                {LABEL[e]}
              </p>
            </Link>
          ))}
        </div>

        {/* Filtros pill */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/admin/postulaciones"
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              !filtroEstado
                ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                : "border-white/20 text-white/50 hover:border-white/40"
            }`}
          >
            Todos
          </Link>
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={`/admin/postulaciones?estado=${e}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                filtroEstado === e
                  ? "border-[#e2b44b] bg-[#e2b44b]/10 text-[#e2b44b]"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              {LABEL[e]}
            </Link>
          ))}
        </div>

        {/* Tabla */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
                <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3 hidden md:table-cell">Cargo postulado</th>
                <th className="px-4 py-3 hidden md:table-cell">Área</th>
                <th className="px-4 py-3 hidden md:table-cell">Región</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-white/30">
                    No hay postulaciones registradas.
                  </td>
                </tr>
              )}
              {postulaciones.map((p: Record<string, string>) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap hidden md:table-cell">
                    {new Date(p.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">
                      {p.nombre} {p.apellidos}
                    </p>
                    <p className="text-xs text-white/40">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-white/70 hidden md:table-cell">{p.cargo_postulado || "—"}</td>
                  <td className="px-4 py-3 text-white/70 hidden md:table-cell">{p.area || "—"}</td>
                  <td className="px-4 py-3 text-white/70 hidden md:table-cell">{p.region || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        BADGE[p.estado as Estado] ?? BADGE.recibida
                      }`}
                    >
                      {LABEL[p.estado as Estado] ?? p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/postulaciones/${p.id}`}
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

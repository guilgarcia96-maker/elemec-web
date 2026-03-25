import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import InformeWizard, { type InformeData } from "@/components/admin/informes/InformeWizard";
import type { FotoItem } from "@/components/admin/informes/StepFotos";
import type { SeccionItem } from "@/components/admin/informes/StepAnalisisIA";

export default async function EditarInformePage({
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

  // Obtener adjuntos (fotos)
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  // Generar URLs firmadas para las fotos existentes (en paralelo)
  const adjuntosImagen = (adjuntos ?? []).filter(
    (adj) => adj.mime_type?.startsWith("image/") && adj.storage_path,
  );
  const signedResults = await Promise.all(
    adjuntosImagen.map((adj, i) =>
      supabase.storage
        .from(adj.storage_bucket ?? "backoffice-docs")
        .createSignedUrl(adj.storage_path, 3600)
        .then(({ data: signed }) =>
          signed?.signedUrl
            ? {
                id: adj.id as string,
                url: signed.signedUrl,
                descripcion: adj.descripcion_ai || "",
                analizando: false,
                orden: adj.orden ?? i + 1,
              }
            : null,
        ),
    ),
  );
  const fotos: FotoItem[] = signedResults.filter((f): f is FotoItem => f !== null);

  // Reconstruir secciones desde contenido_json
  const contenidoRaw = (informe.contenido_json ?? {}) as Record<string, unknown>;
  let secciones: SeccionItem[] = [];

  if (Array.isArray(contenidoRaw.secciones)) {
    secciones = (contenidoRaw.secciones as Array<Record<string, unknown>>).map(
      (s, i) => ({
        id: (s.id as string) ?? `sec_${i}`,
        titulo: (s.titulo as string) ?? "",
        contenido: (s.contenido as string) ?? "",
        tipo: (s.tipo as "texto" | "fotos" | "conclusion") ?? "texto",
        visible: (s.visible as boolean) ?? true,
        orden: (s.orden as number) ?? i + 1,
      }),
    );
  } else {
    // Compatibilidad con formato antiguo (objeto plano de strings)
    const SECCIONES_COMPAT: { key: string; titulo: string }[] = [
      { key: "resumen_ejecutivo", titulo: "Resumen Ejecutivo" },
      { key: "alcance", titulo: "Alcance" },
      { key: "descripcion_trabajos", titulo: "Descripción de Trabajos" },
      { key: "hallazgos", titulo: "Hallazgos" },
      { key: "conclusiones", titulo: "Conclusiones" },
      { key: "recomendaciones", titulo: "Recomendaciones" },
    ];
    secciones = SECCIONES_COMPAT.filter(
      (s) => typeof contenidoRaw[s.key] === "string" && (contenidoRaw[s.key] as string).trim(),
    ).map((s, i) => ({
      id: s.key,
      titulo: s.titulo,
      contenido: contenidoRaw[s.key] as string,
      tipo: "texto" as const,
      visible: true,
      orden: i + 1,
    }));
  }

  const initialData: InformeData = {
    id: informe.id as string,
    titulo: informe.titulo ?? "",
    servicio_tipo: informe.servicio_tipo ?? "",
    cliente_nombre: informe.cliente_nombre ?? "",
    cliente_empresa: informe.cliente_empresa ?? "",
    cliente_email: informe.cliente_email ?? "",
    obra: informe.obra ?? "",
    ubicacion: informe.ubicacion ?? "",
    fecha_trabajo: informe.fecha_trabajo ?? "",
    descripcion_trabajos: informe.descripcion_trabajos ?? "",
    fotos,
    secciones,
  };

  return (
    <AdminShell session={session} active="informes">
      <main className="px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar Informe</h1>
          <p className="mt-1 text-sm text-gray-500">
            {informe.titulo || "Sin título"} &mdash;{" "}
            <span className="font-mono text-orange-500">{informe.codigo || id}</span>
          </p>
        </div>
        <InformeWizard editingId={id} initialData={initialData} />
      </main>
    </AdminShell>
  );
}

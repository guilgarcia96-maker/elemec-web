import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { generateInformeHTML } from "@/lib/informe-html";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* ── POST /api/admin/informes/[id]/enviar ───────────────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "operaciones"])) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  // Obtener informe completo
  const { data: informe, error: fetchError } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  const destinatario: string = informe.cliente_email ?? informe.enviado_a ?? "";
  if (!destinatario) {
    return NextResponse.json(
      { error: "El informe no tiene email del cliente. Agrega el campo cliente_email." },
      { status: 422 },
    );
  }

  // Obtener adjuntos con URLs firmadas
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  const adjuntosImagen = (adjuntos ?? []).filter(
    (adj) => adj.storage_path && adj.mime_type?.startsWith("image/"),
  );
  const fotos = (
    await Promise.all(
      adjuntosImagen.map(async (adj, i) => {
        const { data: signed } = await supabase.storage
          .from(adj.storage_bucket ?? "backoffice-docs")
          .createSignedUrl(adj.storage_path, 86400);
        return signed?.signedUrl
          ? {
              descripcion: adj.descripcion_ai || "",
              url: signed.signedUrl,
              orden: adj.orden ?? i + 1,
            }
          : null;
      }),
    )
  ).filter((f): f is { descripcion: string; url: string; orden: number } => f !== null);

  // Nombre del responsable
  let responsable = session.nombre || "ELEMEC";
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsable = user?.nombre ?? responsable;
  }

  // Extraer secciones de contenido_json (soporta formato nuevo y legacy)
  const contenidoRaw = (informe.contenido_json ?? {}) as Record<string, unknown>;

  type SeccionHTML = { titulo: string; contenido: string; tipo: "texto" | "fotos" | "conclusion" };
  let secciones: SeccionHTML[] = [];

  if (Array.isArray(contenidoRaw.secciones)) {
    secciones = (contenidoRaw.secciones as Array<Record<string, unknown>>)
      .filter((s) => s.visible !== false && typeof s.contenido === "string" && (s.contenido as string).trim())
      .sort((a, b) => ((a.orden as number) ?? 0) - ((b.orden as number) ?? 0))
      .map((s) => ({
        titulo:   (s.titulo   as string) ?? "Sección",
        contenido: s.contenido as string,
        tipo:     (s.tipo     as "texto" | "fotos" | "conclusion") ?? "texto",
      }));
  } else {
    // Compatibilidad con formato antiguo (objeto plano)
    const COMPAT = [
      { key: "resumen_ejecutivo",    titulo: "Resumen Ejecutivo" },
      { key: "alcance",              titulo: "Alcance" },
      { key: "descripcion_trabajos", titulo: "Descripción de Trabajos" },
      { key: "hallazgos",            titulo: "Hallazgos" },
      { key: "conclusiones",         titulo: "Conclusiones" },
      { key: "recomendaciones",      titulo: "Recomendaciones" },
    ];
    secciones = COMPAT
      .filter((s) => typeof contenidoRaw[s.key] === "string" && (contenidoRaw[s.key] as string).trim())
      .map((s) => ({
        titulo:   s.titulo,
        contenido: contenidoRaw[s.key] as string,
        tipo:     "texto" as const,
      }));
  }

  // Generar HTML del informe
  const html = generateInformeHTML({
    codigo:           informe.codigo ?? "",
    titulo:           informe.titulo ?? "",
    servicio_tipo:    informe.servicio_tipo ?? "",
    obra:             informe.obra ?? "",
    ubicacion:        informe.ubicacion ?? "",
    fecha_trabajo:    informe.fecha_trabajo ?? "",
    cliente_nombre:   informe.cliente_nombre ?? "",
    cliente_empresa:  informe.cliente_empresa ?? "",
    responsable_nombre: responsable,
    secciones,
    fotos,
    fecha_emision: new Date().toISOString().split("T")[0],
    estado:        informe.estado ?? "emitido",
  });

  // Enviar email
  const folio = informe.codigo ? `[${informe.codigo}] ` : "";
  const result = await sendEmail({
    to: destinatario,
    subject: `${folio}Informe Técnico ELEMEC — ${informe.titulo ?? "Informe"}`,
    html,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Error al enviar el email" },
      { status: 500 },
    );
  }

  // Marcar como enviado
  await supabase
    .from("informes")
    .update({ enviado_a: destinatario, enviado_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true, enviado_a: destinatario });
}

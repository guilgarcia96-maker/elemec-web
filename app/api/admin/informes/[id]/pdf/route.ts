import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { generateInformeHTML } from "@/lib/informe-html";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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

  if (error || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  // Obtener adjuntos
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  // Obtener nombre del responsable
  let responsableNombre = "—";
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsableNombre = user?.nombre ?? "—";
  }

  // Generar URLs firmadas para fotos
  const fotosConUrl: { descripcion: string; url: string }[] = [];
  for (const adj of adjuntos ?? []) {
    if (adj.storage_path && adj.mime_type?.startsWith("image/")) {
      const { data: signed } = await supabase.storage
        .from(adj.storage_bucket ?? "backoffice-docs")
        .createSignedUrl(adj.storage_path, 3600);

      if (signed?.signedUrl) {
        fotosConUrl.push({
          descripcion: adj.descripcion_ai || "",
          url: signed.signedUrl,
        });
      }
    }
  }

  const contenido = (informe.contenido_json ?? {}) as Record<string, string>;

  const html = generateInformeHTML({
    codigo: informe.codigo ?? "BORRADOR",
    titulo: informe.titulo ?? "",
    servicio_tipo: informe.servicio_tipo ?? "",
    obra: informe.obra ?? "",
    ubicacion: informe.ubicacion ?? "",
    fecha_trabajo: informe.fecha_trabajo ?? "",
    cliente_nombre: informe.cliente_nombre ?? "",
    cliente_empresa: informe.cliente_empresa ?? "",
    responsable: responsableNombre,
    resumen_ejecutivo: contenido.resumen_ejecutivo ?? "",
    alcance: contenido.alcance ?? "",
    descripcion_trabajos: contenido.descripcion_trabajos ?? "",
    hallazgos: contenido.hallazgos ?? "",
    conclusiones: contenido.conclusiones ?? "",
    recomendaciones: contenido.recomendaciones ?? "",
    fotos: fotosConUrl,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

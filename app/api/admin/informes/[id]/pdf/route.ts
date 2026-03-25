import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { generateInformeHTML, InformePDFData } from "@/lib/informe-html";

/* ── Mapeo de campos planos de contenido_json a secciones ── */
const SECCIONES_ORDEN: Array<{
  key:    string;
  titulo: string;
  tipo:   'texto' | 'fotos' | 'conclusion';
}> = [
  { key: 'resumen_ejecutivo',    titulo: 'Resumen Ejecutivo',      tipo: 'texto' },
  { key: 'alcance',              titulo: 'Alcance',                tipo: 'texto' },
  { key: 'descripcion_trabajos', titulo: 'Descripción de Trabajos', tipo: 'texto' },
  { key: 'hallazgos',            titulo: 'Hallazgos',              tipo: 'texto' },
  { key: 'conclusiones',         titulo: 'Conclusiones',           tipo: 'conclusion' },
  { key: 'recomendaciones',      titulo: 'Recomendaciones',        tipo: 'conclusion' },
];

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

  /* ── Obtener informe ─────────────────────────────────── */
  const { data: informe, error } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  /* ── Obtener adjuntos ────────────────────────────────── */
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  /* ── Nombre del responsable ──────────────────────────── */
  let responsableNombre = "";
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsableNombre = user?.nombre ?? "";
  }

  /* ── URLs para fotos ─────────────────────────────────── */
  // Preferir URLs públicas si el bucket es público; fallback a signed URL.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const fotosConUrl: InformePDFData["fotos"] = [];

  for (const adj of adjuntos ?? []) {
    if (!adj.storage_path || !adj.mime_type?.startsWith("image/")) continue;

    const bucket = adj.storage_bucket ?? "backoffice-docs";
    let imageUrl = "";

    // Intentar URL pública primero (más estable para renderizado PDF)
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${adj.storage_path}`;
    // Generar URL firmada como respaldo
    const { data: signed } = await supabase.storage
      .from(bucket)
      .createSignedUrl(adj.storage_path, 7200); // 2 horas de validez

    imageUrl = signed?.signedUrl ?? publicUrl;

    if (imageUrl) {
      fotosConUrl.push({
        url:         imageUrl,
        descripcion: adj.descripcion_ai ?? "",
        orden:       adj.orden ?? fotosConUrl.length,
      });
    }
  }

  /* ── Construir secciones desde contenido_json ────────── */
  const contenido = (informe.contenido_json ?? {}) as Record<string, string>;

  const secciones: InformePDFData["secciones"] = SECCIONES_ORDEN
    .filter((s) => contenido[s.key]?.trim())
    .map((s) => ({
      titulo:    s.titulo,
      contenido: contenido[s.key] ?? "",
      tipo:      s.tipo,
    }));

  /* ── Generar HTML ────────────────────────────────────── */
  const pdfData: InformePDFData = {
    codigo:             informe.codigo        ?? "BORRADOR",
    titulo:             informe.titulo        ?? "",
    servicio_tipo:      informe.servicio_tipo ?? "",
    fecha_trabajo:      informe.fecha_trabajo ?? "",
    ubicacion:          informe.ubicacion     ?? "",
    cliente_nombre:     informe.cliente_nombre  ?? "",
    cliente_empresa:    informe.cliente_empresa ?? "",
    obra:               informe.obra ?? "",
    responsable_nombre: responsableNombre,
    secciones,
    fotos:              fotosConUrl,
    fecha_emision:      informe.fecha_emision ?? informe.created_at ?? "",
    estado:             informe.estado        ?? "borrador",
  };

  const html = generateInformeHTML(pdfData);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

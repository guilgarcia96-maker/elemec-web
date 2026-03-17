import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

function inferMimeType(fileName: string, fallback?: string | null) {
  if (fallback && fallback !== "application/octet-stream") return fallback;
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "txt":
      return "text/plain; charset=utf-8";
    case "csv":
      return "text/csv; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    default:
      return fallback || "application/octet-stream";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adjuntoId: string }> }
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adjuntoId } = await params;
  if (!adjuntoId) {
    return NextResponse.json({ error: "Invalid attachment id" }, { status: 400 });
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("cotizacion_adjuntos")
    .select("nombre_archivo, mime_type, storage_bucket, storage_path")
    .eq("id", adjuntoId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(attachment.storage_bucket)
    .download(attachment.storage_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 500 });
  }

  const fileBuffer = await fileData.arrayBuffer();
  const mimeType = inferMimeType(attachment.nombre_archivo || attachment.storage_path, attachment.mime_type);
  const encodedName = encodeURIComponent(attachment.nombre_archivo);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adjuntoId: string }> }
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "ventas", "operaciones"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { adjuntoId } = await params;
  if (!adjuntoId) {
    return NextResponse.json({ error: "Invalid attachment id" }, { status: 400 });
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("cotizacion_adjuntos")
    .select("id, cotizacion_id, nombre_archivo, storage_bucket, storage_path")
    .eq("id", adjuntoId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const { error: storageDeleteError } = await supabase.storage
    .from(attachment.storage_bucket)
    .remove([attachment.storage_path]);

  if (storageDeleteError) {
    return NextResponse.json({ error: "No se pudo eliminar el archivo en storage" }, { status: 500 });
  }

  const { error: rowDeleteError } = await supabase
    .from("cotizacion_adjuntos")
    .delete()
    .eq("id", adjuntoId);

  if (rowDeleteError) {
    return NextResponse.json({ error: "No se pudo eliminar el registro adjunto" }, { status: 500 });
  }

  await supabase.from("cotizacion_seguimientos").insert([
    {
      cotizacion_id: attachment.cotizacion_id,
      actor_id: session.userId === "legacy-admin" ? null : session.userId,
      tipo: "adjunto_eliminado",
      detalle: `Adjunto eliminado: ${attachment.nombre_archivo}`,
    },
  ]);

  return NextResponse.json({ ok: true });
}

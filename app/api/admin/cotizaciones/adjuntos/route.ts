import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "ventas", "operaciones"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const cotizacionId = String(formData.get("id") ?? "");
  const archivos = formData.getAll("archivos").filter((value) => value instanceof File) as File[];

  if (!cotizacionId || archivos.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  for (const file of archivos) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const storagePath = `cotizaciones/${cotizacionId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("backoffice-docs")
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("cotizacion_adjuntos").insert([
      {
        cotizacion_id: cotizacionId,
        nombre_archivo: file.name,
        mime_type: file.type || "application/octet-stream",
        tamano_bytes: file.size,
        storage_bucket: "backoffice-docs",
        storage_path: storagePath,
        subido_por: session.userId === "legacy-admin" ? null : session.userId,
      },
    ]);

    if (insertError) {
      console.error("Attachment insert error:", insertError.message);
      return NextResponse.json({ error: "No se pudo registrar el archivo" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
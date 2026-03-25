import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Se requiere multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Los campos nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  const telefono = (formData.get("telefono") as string | null)?.trim() || null;
  const celular = (formData.get("celular") as string | null)?.trim() || null;
  const cargo = (formData.get("cargo") as string | null)?.trim() || null;
  const mensaje = (formData.get("mensaje") as string | null)?.trim() || null;

  const cvFile = formData.get("cv");
  const cv = cvFile instanceof File && cvFile.size > 0 ? cvFile : null;

  // Combinar celular en notas si fue enviado
  const notas = celular ? `Celular: ${celular}` : null;

  const insertData = {
    nombre,
    email,
    telefono,
    cargo_postulado: cargo,
    resumen: mensaje,
    notas,
    estado: "recibida" as const,
  };

  const { data: inserted, error: dbError } = await supabase
    .from("postulaciones")
    .insert([insertData])
    .select("id")
    .single();

  if (dbError) {
    console.error("Supabase insert error:", dbError.message);
    return NextResponse.json(
      { error: "No se pudo guardar la postulación" },
      { status: 500 }
    );
  }

  const postulacionId: string = inserted.id;

  if (cv) {
    const fileBytes = Buffer.from(await cv.arrayBuffer());
    const safeName = sanitizeFileName(cv.name);
    const storagePath = `postulaciones/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("backoffice-docs")
      .upload(storagePath, fileBytes, {
        contentType: cv.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("CV upload error:", uploadError.message);
      // No abortamos — la postulación ya fue guardada
    } else {
      const { error: attachError } = await supabase
        .from("postulacion_adjuntos")
        .insert([
          {
            postulacion_id: postulacionId,
            nombre_archivo: cv.name,
            mime_type: cv.type || "application/octet-stream",
            tamano_bytes: cv.size,
            storage_bucket: "backoffice-docs",
            storage_path: storagePath,
            tipo: "cv",
          },
        ]);

      if (attachError) {
        console.error("CV metadata error:", attachError.message);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

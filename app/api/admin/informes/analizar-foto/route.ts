import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "operaciones"])) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("foto") as File | null;
    const fotoUrl = formData.get("foto_url") as string | null;
    const informeId = formData.get("informe_id") as string | null;

    if (!file && !fotoUrl) {
      return NextResponse.json({ error: "No se envio imagen (foto o foto_url)" }, { status: 400 });
    }
    if (!informeId) {
      return NextResponse.json({ error: "informe_id es requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let imageUrlForVision: string;
    let storagePath: string | null = null;
    let adjuntoId: string | null = null;
    let mimeType = "image/jpeg";

    if (file) {
      // Flujo con archivo: subir a Storage + analizar
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      mimeType = file.type || "image/jpeg";

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `informes/${informeId}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("backoffice-docs")
        .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

      if (uploadError) {
        console.error("Error subiendo imagen:", uploadError.message);
        return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
      }

      imageUrlForVision = `data:${mimeType};base64,${base64}`;
    } else {
      // Flujo con URL existente: solo re-analizar
      imageUrlForVision = fotoUrl!;
    }

    // Analizar con GPT-4o-mini Vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-nano",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente tecnico de ELEMEC, empresa de servicios industriales. Describe esta fotografia de manera tecnica y profesional para un informe de trabajo. Incluye: que se observa, equipos o componentes visibles, estado de los trabajos, y cualquier observacion relevante. Se conciso pero preciso. Responde en espanol.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Describe esta fotografia para un informe tecnico:" },
            {
              type: "image_url",
              image_url: { url: imageUrlForVision, detail: "auto" },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const descripcionAi = response.choices[0]?.message?.content?.trim() || "";

    // Solo insertar adjunto si se subió un archivo nuevo
    if (file && storagePath) {
      const { data: maxOrden } = await supabase
        .from("informe_adjuntos")
        .select("orden")
        .eq("informe_id", informeId)
        .order("orden", { ascending: false })
        .limit(1);

      const nextOrden = (maxOrden?.[0]?.orden ?? -1) + 1;

      const { data: adjunto, error: insertError } = await supabase
        .from("informe_adjuntos")
        .insert({
          informe_id: informeId,
          nombre_archivo: file.name,
          mime_type: mimeType,
          tamano_bytes: file.size,
          storage_bucket: "backoffice-docs",
          storage_path: storagePath,
          descripcion_ai: descripcionAi,
          orden: nextOrden,
          subido_por: session.userId,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error insertando adjunto:", insertError.message);
        return NextResponse.json({ error: "Error al guardar adjunto" }, { status: 500 });
      }

      adjuntoId = (adjunto as { id: string }).id;
    }

    return NextResponse.json({
      id: adjuntoId,
      storagePath,
      descripcion_ai: descripcionAi,
      descripcion: descripcionAi,
    });
  } catch (error) {
    console.error("Error analizando foto:", error);
    return NextResponse.json({ error: "Error al procesar la imagen" }, { status: 500 });
  }
}

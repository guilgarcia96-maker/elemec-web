import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió imagen" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Subir imagen a Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `conciliacion/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("backoffice-docs")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError.message);
      return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
    }

    // Obtener categorías existentes
    const { data: catRows } = await supabase
      .from("conciliacion_movimientos")
      .select("categoria")
      .order("categoria");

    const categorias = [...new Set((catRows ?? []).map((r: { categoria: string }) => r.categoria).filter(Boolean))];

    // OCR con OpenAI Vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente que analiza imágenes de recibos, tickets y facturas. Extrae la información y responde SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "ocrText": "texto completo extraído del documento",
  "monto": número total (el monto más alto o el total final, solo número sin símbolo de moneda),
  "descripcion": "descripción corta del gasto o ingreso (nombre del negocio o concepto principal)",
  "fecha": "fecha del documento en formato YYYY-MM-DD si es visible, o null",
  "categoria": "una de estas categorías: ${categorias.join(", ")}",
  "tipo": "ingreso o egreso según el tipo de documento",
  "referencia": "número de factura, boleta o recibo si es visible, o null"
}
Si no puedes extraer algún campo, usa null para ese campo. Para categoria, elige la más apropiada basándote en el tipo de documento. Para tipo, usa "egreso" si es un gasto/compra y "ingreso" si es un cobro/venta.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza este documento y extrae la información:" },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Si no se pudo parsear, devolver el texto crudo
      return NextResponse.json({
        ocrText: content,
        monto: null,
        descripcion: null,
        fecha: null,
        categoria: categorias[0] || null,
        tipo: "egreso",
        referencia: null,
        storagePath,
        categorias,
      });
    }

    return NextResponse.json({
      ocrText: parsed.ocrText || content,
      monto: parsed.monto ?? null,
      descripcion: parsed.descripcion || null,
      fecha: parsed.fecha || null,
      categoria: categorias.includes(parsed.categoria) ? parsed.categoria : categorias[0] || null,
      tipo: parsed.tipo === "ingreso" ? "ingreso" : "egreso",
      referencia: parsed.referencia || null,
      storagePath,
      categorias,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "Error al procesar la imagen con OpenAI" }, { status: 500 });
  }
}

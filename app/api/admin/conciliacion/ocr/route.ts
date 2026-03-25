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

    // Obtener categorías desde gastos_categorias
    const { data: catRows } = await supabase
      .from("gastos_categorias")
      .select("id, nombre")
      .order("nombre");

    const categorias: { id: string; nombre: string }[] = (catRows ?? []) as { id: string; nombre: string }[];
    const categoriasNombres = categorias.map((c) => c.nombre);

    // OCR con OpenAI Vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente que analiza imágenes de recibos, tickets y facturas chilenas. Extrae la información y responde SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "ocrText": "texto completo extraído del documento",
  "monto": número total (el monto más alto o el total final, solo número sin símbolo de moneda),
  "descripcion": "descripción corta del gasto o ingreso (nombre del negocio o concepto principal)",
  "fecha": "fecha del documento en formato YYYY-MM-DD si es visible, o null",
  "categoria": "una de estas categorías: ${categoriasNombres.join(", ")}",
  "tipo": "ingreso o egreso según el tipo de documento",
  "referencia": "número de factura, boleta o recibo si es visible, o null",
  "rut_emisor": "RUT del emisor/proveedor en formato XX.XXX.XXX-X, o null",
  "razon_social_emisor": "nombre legal del emisor tal como aparece en el documento, o null",
  "tipo_documento": "uno de: boleta, factura, factura_exenta, nota_credito, guia_despacho. Detectar del encabezado (BOLETA ELECTRONICA, FACTURA ELECTRONICA, FACTURA EXENTA, NOTA DE CREDITO, GUIA DE DESPACHO), o null",
  "monto_neto": número neto sin IVA (si solo ves el total, calcular: neto = total / 1.19), o null,
  "monto_iva": número del IVA 19% (si solo ves neto: iva = neto * 0.19; si solo ves total: iva = total - total/1.19), o null,
  "monto_total": número total con IVA incluido (si solo ves neto: total = neto * 1.19), o null,
  "forma_pago": "uno de: efectivo, transferencia, tarjeta_debito, tarjeta_credito, cheque, otro. Solo si es visible en el documento, o null",
  "rut_receptor": "RUT del receptor en formato XX.XXX.XXX-X si es visible, o null"
}
Si no puedes extraer algún campo, usa null. Para categoria, elige la más apropiada. Para tipo, usa "egreso" si es gasto/compra y "ingreso" si es cobro/venta. Los RUT deben formatearse como XX.XXX.XXX-X. Para boletas, el monto visible suele ser el total con IVA incluido.`,
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
      const fallbackCat = categorias[0] ?? null;
      return NextResponse.json({
        ocrText: content,
        monto: null,
        descripcion: null,
        fecha: null,
        categoria: fallbackCat?.nombre ?? null,
        categoria_id: fallbackCat?.id ?? null,
        tipo: "egreso",
        referencia: null,
        rut_emisor: null,
        razon_social_emisor: null,
        tipo_documento: null,
        monto_neto: null,
        monto_iva: null,
        monto_total: null,
        forma_pago: null,
        rut_receptor: null,
        storagePath,
        categorias,
      });
    }

    const TIPOS_DOC_VALIDOS   = ["boleta", "factura", "factura_exenta", "nota_credito", "guia_despacho"];
    const FORMAS_PAGO_VALIDAS = ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito", "cheque", "otro"];

    // Resolver categoría sugerida por IA
    const matchedCat = categorias.find(
      (c) => c.nombre.toLowerCase() === String(parsed.categoria ?? "").toLowerCase()
    ) ?? categorias[0] ?? null;

    return NextResponse.json({
      ocrText: parsed.ocrText || content,
      monto: parsed.monto ?? null,
      descripcion: parsed.descripcion || null,
      fecha: parsed.fecha || null,
      categoria: matchedCat?.nombre ?? null,
      categoria_id: matchedCat?.id ?? null,
      tipo: parsed.tipo === "ingreso" ? "ingreso" : "egreso",
      referencia: parsed.referencia || null,
      rut_emisor: parsed.rut_emisor || null,
      razon_social_emisor: parsed.razon_social_emisor || null,
      tipo_documento: TIPOS_DOC_VALIDOS.includes(parsed.tipo_documento) ? parsed.tipo_documento : null,
      monto_neto: parsed.monto_neto ?? null,
      monto_iva: parsed.monto_iva ?? null,
      monto_total: parsed.monto_total ?? null,
      forma_pago: FORMAS_PAGO_VALIDAS.includes(parsed.forma_pago) ? parsed.forma_pago : null,
      rut_receptor: parsed.rut_receptor || null,
      storagePath,
      categorias,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "Error al procesar la imagen con OpenAI" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
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

  let body: {
    informe_id?: string;
    tipo_servicio?: string;
    obra?: string;
    descripcion_trabajos?: string;
    fotos_descripciones?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud invalido" }, { status: 400 });
  }

  if (!body.descripcion_trabajos?.trim()) {
    return NextResponse.json(
      { error: "La descripcion de los trabajos es requerida" },
      { status: 422 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const fotosContext =
      body.fotos_descripciones && body.fotos_descripciones.length > 0
        ? `\n\nDescripciones de las fotografias del trabajo:\n${body.fotos_descripciones
            .map((d, i) => `- Foto ${i + 1}: ${d}`)
            .join("\n")}`
        : "";

    const userContent = `Genera un informe tecnico con la siguiente informacion:

Tipo de servicio: ${body.tipo_servicio || "No especificado"}
Obra/Proyecto: ${body.obra || "No especificado"}

Descripcion de los trabajos realizados:
${body.descripcion_trabajos}${fotosContext}

Responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
{
  "resumen_ejecutivo": "...",
  "alcance": "...",
  "descripcion_trabajos": "...",
  "hallazgos": "...",
  "conclusiones": "...",
  "recomendaciones": "..."
}

Cada campo debe ser un parrafo o varios parrafos de texto profesional. No uses listas con viñetas, usa texto corrido con oraciones completas.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un redactor tecnico profesional de ELEMEC, empresa de servicios industriales en Chile. Genera un informe tecnico profesional basado en el contexto proporcionado. El informe debe ser formal, tecnico y conciso. Responde en espanol con formato JSON.",
        },
        { role: "user", content: userContent },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Error al parsear respuesta de IA", raw: content },
        { status: 500 },
      );
    }

    return NextResponse.json({
      resumen_ejecutivo: parsed.resumen_ejecutivo || "",
      alcance: parsed.alcance || "",
      descripcion_trabajos: parsed.descripcion_trabajos || "",
      hallazgos: parsed.hallazgos || "",
      conclusiones: parsed.conclusiones || "",
      recomendaciones: parsed.recomendaciones || "",
    });
  } catch (error) {
    console.error("Error generando texto:", error);
    return NextResponse.json({ error: "Error al generar texto con IA" }, { status: 500 });
  }
}

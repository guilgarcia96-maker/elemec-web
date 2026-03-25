import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";
import OpenAI from "openai";

interface FotoInput {
  url?: string;
  descripcion?: string;
  orden?: number;
}

interface SeccionInput {
  id: string;
  titulo: string;
  tipo?: string;
}

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
    servicio_tipo?: string;
    descripcion_trabajos?: string;
    obra?: string;
    fotos?: FotoInput[];
    secciones?: SeccionInput[];
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

  const seccionesReq = body.secciones ?? [];
  if (seccionesReq.length === 0) {
    return NextResponse.json(
      { error: "Se requiere al menos una seccion para generar" },
      { status: 422 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Contexto de fotos
    const fotosContext =
      body.fotos && body.fotos.length > 0
        ? `\n\nDescripciones de las fotografias del trabajo:\n${body.fotos
            .map((f, i) => `- Foto ${i + 1}: ${f.descripcion || "Sin descripcion"}`)
            .join("\n")}`
        : "";

    // Construir lista de secciones dinámicas
    const seccionesListStr = seccionesReq
      .map((s) => `  - id: "${s.id}", titulo: "${s.titulo}", tipo: "${s.tipo ?? "texto"}"`)
      .join("\n");

    const userContent = `Genera un informe tecnico con la siguiente informacion:

Tipo de servicio: ${body.servicio_tipo || "No especificado"}
Obra/Proyecto: ${body.obra || "No especificado"}

Descripcion de los trabajos realizados:
${body.descripcion_trabajos}${fotosContext}

Debes generar contenido para CADA una de las siguientes secciones:
${seccionesListStr}

Responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
{
  "secciones": [
    { "id": "<id de la seccion>", "contenido": "<texto generado>" }
  ]
}

Cada campo "contenido" debe ser uno o varios parrafos de texto profesional. No uses listas con viñetas, usa texto corrido con oraciones completas. Genera contenido para TODAS las secciones listadas.`;

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
      max_tokens: 3000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    let parsed: { secciones?: Array<{ id: string; contenido: string }> };
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Error al parsear respuesta de IA", raw: content },
        { status: 500 },
      );
    }

    // Asegurar que devolvemos el formato esperado
    const seccionesResult = seccionesReq.map((sec) => {
      const generada = parsed.secciones?.find((g) => g.id === sec.id);
      return {
        id: sec.id,
        contenido: generada?.contenido || "",
      };
    });

    return NextResponse.json({ secciones: seccionesResult });
  } catch (error) {
    console.error("Error generando texto:", error);
    return NextResponse.json({ error: "Error al generar texto con IA" }, { status: 500 });
  }
}

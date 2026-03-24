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

  const body = await req.json().catch(() => null);
  if (!body?.descripcion) {
    return NextResponse.json({ error: "Descripción requerida" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener categorías existentes
  const { data: categorias } = await supabase
    .from("gastos_categorias")
    .select("nombre");

  const categoryNames = (categorias ?? []).map(c => c.nombre);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que clasifica gastos empresariales. Dada una descripción de gasto, responde SOLO con el nombre exacto de la categoría más apropiada de esta lista: ${categoryNames.join(", ")}. Si ninguna aplica, responde "Otros". No expliques nada, solo el nombre.`,
      },
      {
        role: "user",
        content: `Descripción del gasto: "${body.descripcion}"${body.monto ? ` (Monto: $${body.monto})` : ""}`,
      },
    ],
    max_tokens: 50,
    temperature: 0,
  });

  const suggested = completion.choices[0]?.message?.content?.trim() ?? "Otros";

  return NextResponse.json({ category: suggested });
}

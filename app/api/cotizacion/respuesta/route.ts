import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/cotizacion/respuesta
 * Permite al cliente aprobar o rechazar una cotización usando su tracking_token.
 * No requiere autenticación — el token es la credencial.
 */
export async function POST(req: NextRequest) {
  let body: { tracking_token?: string; decision?: string; comentario?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { tracking_token, decision, comentario } = body;

  if (!tracking_token || typeof tracking_token !== "string") {
    return NextResponse.json({ error: "tracking_token es requerido" }, { status: 400 });
  }

  if (!decision || !["aprobada", "rechazada"].includes(decision)) {
    return NextResponse.json(
      { error: "decision debe ser 'aprobada' o 'rechazada'" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar cotización por tracking_token
  const { data: cotizacion, error: fetchError } = await supabase
    .from("cotizaciones")
    .select("id, estado, codigo")
    .eq("tracking_token", tracking_token)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "Error al buscar cotización" }, { status: 500 });
  }

  if (!cotizacion) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  // Solo se puede responder si está en estado 'cotizada'
  if (cotizacion.estado !== "cotizada") {
    return NextResponse.json(
      { error: `La cotización no está en estado 'cotizada' (estado actual: ${cotizacion.estado})` },
      { status: 422 }
    );
  }

  // Determinar nuevo estado
  const nuevoEstado = decision === "aprobada" ? "ganada" : "perdida";

  // Construir payload
  const updatePayload: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "perdida" && comentario) {
    updatePayload.motivo_perdida = comentario.slice(0, 2000);
  }

  const { error: updateError } = await supabase
    .from("cotizaciones")
    .update(updatePayload)
    .eq("id", cotizacion.id);

  if (updateError) {
    return NextResponse.json({ error: "No se pudo actualizar el estado" }, { status: 500 });
  }

  // Registrar seguimiento
  await supabase.from("cotizacion_seguimientos").insert([
    {
      cotizacion_id: cotizacion.id,
      actor_id: null, // Sin actor — es el cliente
      tipo: "respuesta_cliente",
      detalle: `Cliente ${decision === "aprobada" ? "aprobó" : "rechazó"} la cotización${
        comentario ? ` — ${comentario.slice(0, 500)}` : ""
      }`,
      estado_anterior: "cotizada",
      estado_nuevo: nuevoEstado,
    },
  ]);

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}

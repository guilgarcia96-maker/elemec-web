import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const ESTADOS = ["proceso", "nueva", "en_revision", "cotizada", "ganada", "perdida"] as const;

// Transiciones válidas por estado actual
const TRANSICIONES: Record<string, readonly string[]> = {
  proceso:     ["nueva", "en_revision", "cotizada"],
  nueva:       ["en_revision", "cotizada", "perdida", "proceso"],
  en_revision: ["cotizada", "perdida", "proceso"],
  cotizada:    ["ganada", "perdida", "proceso"],
  ganada:      [],       // terminal
  perdida:     ["proceso"],
};

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "ventas", "operaciones"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const id = formData.get("id") as string;
  const estado = formData.get("estado") as string;
  const motivoPerdida = (formData.get("motivo_perdida") as string)?.slice(0, 2000) ?? null;

  if (!id || !ESTADOS.includes(estado as typeof ESTADOS[number])) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener estado actual para validar transición
  const { data: prev, error: fetchError } = await supabase
    .from("cotizaciones")
    .select("estado")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !prev) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  // Validar transición en código (mejor mensajes de error que el trigger)
  const permitidas = TRANSICIONES[prev.estado] ?? [];
  if (!permitidas.includes(estado)) {
    return NextResponse.json(
      { error: `Transición no permitida: ${prev.estado} → ${estado}` },
      { status: 422 }
    );
  }

  // Construir payload de actualización
  const updatePayload: Record<string, unknown> = { estado };
  if (estado === "perdida" && motivoPerdida) {
    updatePayload.motivo_perdida = motivoPerdida;
  }

  const { error: updateError } = await supabase
    .from("cotizaciones")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    // Capturar error del trigger de transición de estado
    if (updateError.message?.includes("Transición de estado no permitida")) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Registrar seguimiento
  await supabase.from("cotizacion_seguimientos").insert([
    {
      cotizacion_id: id,
      actor_id: session.userId === "legacy-admin" ? null : session.userId,
      tipo: "cambio_estado",
      detalle: `Estado actualizado de ${prev.estado} a ${estado}${
        estado === "perdida" && motivoPerdida ? ` — Motivo: ${motivoPerdida}` : ""
      }`,
      estado_anterior: prev.estado,
      estado_nuevo: estado,
    },
  ]);

  return NextResponse.redirect(new URL(`/admin/cotizaciones/${id}`, req.url));
}

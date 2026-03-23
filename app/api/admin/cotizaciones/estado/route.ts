import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const ESTADOS = ["proceso", "nueva", "en_revision", "cotizada", "ganada", "perdida"];

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

  if (!id || !ESTADOS.includes(estado)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Capturar estado anterior para auditoría
  const { data: prev } = await supabase
    .from("cotizaciones")
    .select("estado")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("cotizaciones").update({ estado }).eq("id", id);
  await supabase.from("cotizacion_seguimientos").insert([
    {
      cotizacion_id: id,
      actor_id: session.userId === "legacy-admin" ? null : session.userId,
      tipo: "cambio_estado",
      detalle: `Estado actualizado de ${prev?.estado ?? "desconocido"} a ${estado}`,
      estado_anterior: prev?.estado ?? null,
      estado_nuevo: estado,
    },
  ]);

  return NextResponse.redirect(new URL(`/admin/cotizaciones/${id}`, req.url));
}

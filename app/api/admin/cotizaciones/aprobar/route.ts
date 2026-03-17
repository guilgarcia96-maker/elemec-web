import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin"])) {
    return NextResponse.json({ error: "Solo admin puede aprobar cotizaciones" }, { status: 403 });
  }

  const form = await req.formData();
  const cotizacion_version_id = (form.get("cotizacion_version_id") ?? "").toString().trim();
  const nivel = parseInt((form.get("nivel") ?? "1").toString(), 10);
  const decision = (form.get("decision") ?? "").toString().trim();
  const comentario = (form.get("comentario") ?? "").toString().trim().slice(0, 2000);
  const cotizacion_id = (form.get("cotizacion_id") ?? "").toString().trim();

  if (!cotizacion_version_id || !["aprobada", "rechazada"].includes(decision)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("cotizacion_aprobaciones")
    .upsert(
      {
        cotizacion_version_id,
        nivel,
        estado: decision,
        aprobado_por: session.userId,
        aprobado_at: new Date().toISOString(),
        comentario: comentario || null,
      },
      { onConflict: "cotizacion_version_id,nivel" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const redirect = cotizacion_id ? `/admin/cotizaciones/${cotizacion_id}` : "/admin/cotizaciones";
  return NextResponse.redirect(new URL(redirect, req.url));
}

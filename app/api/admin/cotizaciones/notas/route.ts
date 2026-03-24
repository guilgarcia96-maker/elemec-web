import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

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
  const notas_internas = (formData.get("notas_internas") as string)?.slice(0, 5000) ?? "";

  if (!id) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("cotizaciones").update({ notas_internas }).eq("id", id);
  await supabase.from("cotizacion_seguimientos").insert([
    {
      cotizacion_id: id,
      actor_id: session.userId === "legacy-admin" ? null : session.userId,
      tipo: "nota_interna",
      detalle: "Notas internas actualizadas",
    },
  ]);

  return NextResponse.redirect(new URL(`/admin/cotizaciones/${id}`, req.url));
}

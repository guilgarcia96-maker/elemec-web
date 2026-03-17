import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const ESTADOS = ["pendiente", "conciliado", "observado"];

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const id     = formData.get("id") as string;
  const estado = formData.get("estado") as string;

  if (!id || !ESTADOS.includes(estado)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("conciliacion_movimientos").update({ estado }).eq("id", id);

  return NextResponse.redirect(new URL("/admin/conciliacion", req.url));
}

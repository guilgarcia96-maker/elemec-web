import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const ESTADOS = ["recibida", "en_revision", "entrevista", "aprobada", "rechazada", "contratada"];

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "rrhh", "operaciones"])) {
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

  const { data: prev } = await supabase
    .from("postulaciones")
    .select("estado")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("postulaciones")
    .update({ estado })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "rrhh"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let id: string;
  try {
    const body = await req.json();
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener adjuntos para limpiar Storage
  const { data: adjuntos } = await supabase
    .from("postulacion_adjuntos")
    .select("id, storage_path")
    .eq("postulacion_id", id);

  // Eliminar archivos de Storage
  if (adjuntos && adjuntos.length > 0) {
    const paths = adjuntos
      .map((a) => a.storage_path)
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from("backoffice-docs").remove(paths);
    }

    // Eliminar registros de adjuntos
    const { error: adjErr } = await supabase
      .from("postulacion_adjuntos")
      .delete()
      .eq("postulacion_id", id);

    if (adjErr) {
      return NextResponse.json({ error: adjErr.message }, { status: 500 });
    }
  }

  // Eliminar la postulación
  const { error } = await supabase
    .from("postulaciones")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

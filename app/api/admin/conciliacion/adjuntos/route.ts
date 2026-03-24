import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

/**
 * GET /api/admin/conciliacion/adjuntos?movimiento_id=xxx
 * Devuelve los adjuntos vinculados a un movimiento de conciliación.
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const movimientoId = req.nextUrl.searchParams.get("movimiento_id");
  if (!movimientoId) {
    return NextResponse.json({ error: "movimiento_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conciliacion_adjuntos")
    .select("id, nombre_archivo, storage_path, mime_type, created_at")
    .eq("movimiento_id", movimientoId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

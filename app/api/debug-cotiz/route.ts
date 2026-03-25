import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

/**
 * GET /api/debug-cotiz?id=<uuid>
 * Devuelve TODOS los campos de una cotización tal como están en la DB.
 * Solo accesible por admins autenticados.
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Se requiere el parámetro ?id=<uuid>" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Cotización principal
  const { data: cotiz, error: cotizErr } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (cotizErr) {
    return NextResponse.json({ error: cotizErr.message }, { status: 500 });
  }
  if (!cotiz) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  // Versiones
  const { data: versiones } = await supabase
    .from("cotizacion_versiones")
    .select("*")
    .eq("cotizacion_id", id)
    .order("version_num", { ascending: false });

  // Items de la última versión
  let items: unknown[] = [];
  if (versiones && versiones.length > 0) {
    const lastVersionId = versiones[0].id;
    const { data: itemsData } = await supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_version_id", lastVersionId)
      .order("item_num", { ascending: true });
    items = itemsData ?? [];
  }

  return NextResponse.json({
    cotizacion: cotiz,
    versiones: versiones ?? [],
    items,
    _meta: {
      cotizacion_keys: Object.keys(cotiz),
      non_null_fields: Object.entries(cotiz)
        .filter(([, v]) => v !== null)
        .map(([k]) => k),
      null_fields: Object.entries(cotiz)
        .filter(([, v]) => v === null)
        .map(([k]) => k),
    },
  });
}

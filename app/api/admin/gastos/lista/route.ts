import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const desde = url.searchParams.get("desde");
  const hasta = url.searchParams.get("hasta");
  const categoriaId = url.searchParams.get("categoria_id");
  const busqueda = url.searchParams.get("busqueda");

  const supabase = getSupabase();
  let query = supabase
    .from("conciliacion_movimientos")
    .select("id, fecha, descripcion, categoria, categoria_id, subcategoria, monto, referencia, centro_costo, estado")
    .eq("tipo", "egreso")
    .order("fecha", { ascending: false })
    .limit(500);

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  if (categoriaId) query = query.eq("categoria_id", categoriaId);
  if (busqueda) {
    query = query.or(`descripcion.ilike.%${busqueda}%,referencia.ilike.%${busqueda}%,categoria.ilike.%${busqueda}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.fecha) updates.fecha = body.fecha;
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion || null;
  if (body.categoria !== undefined) updates.categoria = body.categoria || null;
  if (body.categoria_id !== undefined) updates.categoria_id = body.categoria_id || null;
  if (body.subcategoria !== undefined) updates.subcategoria = body.subcategoria || null;
  if (body.monto !== undefined) updates.monto = Number(body.monto);
  if (body.referencia !== undefined) updates.referencia = body.referencia || null;
  if (body.centro_costo !== undefined) updates.centro_costo = body.centro_costo || null;

  const supabase = getSupabase();
  const { error } = await supabase
    .from("conciliacion_movimientos")
    .update(updates)
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("conciliacion_movimientos")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

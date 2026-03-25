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
    .select("id, fecha, descripcion, categoria, categoria_id, subcategoria, monto, referencia, centro_costo, estado, rut_emisor, razon_social_emisor, tipo_documento, monto_neto, monto_iva, monto_total, forma_pago, rut_receptor, conciliacion_adjuntos(id, storage_path)")
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

  const TIPOS_DOC_VALIDOS = ["boleta", "factura", "factura_exenta", "nota_credito", "guia_despacho"];
  const FORMAS_PAGO_VALIDAS = ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito", "cheque", "otro"];

  const updates: Record<string, unknown> = {};
  if (body.fecha) updates.fecha = body.fecha;
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion || null;
  if (body.categoria !== undefined) updates.categoria = body.categoria || null;
  if (body.categoria_id !== undefined) updates.categoria_id = body.categoria_id || null;
  if (body.subcategoria !== undefined) updates.subcategoria = body.subcategoria || null;
  if (body.monto !== undefined) updates.monto = Number(body.monto);
  if (body.referencia !== undefined) updates.referencia = body.referencia || null;
  if (body.centro_costo !== undefined) updates.centro_costo = body.centro_costo || null;
  if (body.rut_emisor !== undefined) updates.rut_emisor = body.rut_emisor || null;
  if (body.razon_social_emisor !== undefined) updates.razon_social_emisor = body.razon_social_emisor || null;
  if (body.tipo_documento !== undefined) updates.tipo_documento = TIPOS_DOC_VALIDOS.includes(body.tipo_documento) ? body.tipo_documento : null;
  if (body.monto_neto !== undefined) updates.monto_neto = body.monto_neto != null && !isNaN(Number(body.monto_neto)) ? Number(body.monto_neto) : null;
  if (body.monto_iva !== undefined) updates.monto_iva = body.monto_iva != null && !isNaN(Number(body.monto_iva)) ? Number(body.monto_iva) : null;
  if (body.monto_total !== undefined) updates.monto_total = body.monto_total != null && !isNaN(Number(body.monto_total)) ? Number(body.monto_total) : null;
  if (body.forma_pago !== undefined) updates.forma_pago = FORMAS_PAGO_VALIDAS.includes(body.forma_pago) ? body.forma_pago : null;
  if (body.rut_receptor !== undefined) updates.rut_receptor = body.rut_receptor || null;

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

  // 1. Obtener adjuntos del movimiento
  const { data: adjuntos } = await supabase
    .from("conciliacion_adjuntos")
    .select("id, storage_path")
    .eq("movimiento_id", id);

  // 2. Eliminar archivos de Storage
  if (adjuntos && adjuntos.length > 0) {
    const paths = adjuntos
      .map((a: { id: string; storage_path: string | null }) => a.storage_path)
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("backoffice-docs").remove(paths);
    }

    // 3. Eliminar registros de adjuntos
    await supabase
      .from("conciliacion_adjuntos")
      .delete()
      .eq("movimiento_id", id);
  }

  // 4. Eliminar el movimiento
  const { error } = await supabase
    .from("conciliacion_movimientos")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

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
  const mes = Number(url.searchParams.get("mes") || new Date().getMonth() + 1);
  const anio = Number(url.searchParams.get("anio") || new Date().getFullYear());

  const supabase = getSupabase();

  // Presupuestos con categoria
  const { data: presupuestos, error } = await supabase
    .from("gastos_presupuestos")
    .select("id, monto, mes, anio, centro_costo, categoria_id, gastos_categorias(id, nombre, color, icono)")
    .eq("mes", mes)
    .eq("anio", anio)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Gastos reales del mes por categoria_id
  const startDate = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const endMonth = mes === 12 ? 1 : mes + 1;
  const endYear = mes === 12 ? anio + 1 : anio;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: egresos } = await supabase
    .from("conciliacion_movimientos")
    .select("monto, categoria_id, categoria")
    .eq("tipo", "egreso")
    .gte("fecha", startDate)
    .lt("fecha", endDate);

  // Calcular gastos por categoria
  const { data: categoriasDB } = await supabase
    .from("gastos_categorias")
    .select("id, nombre");
  const catByName = new Map((categoriasDB ?? []).map(c => [c.nombre, c.id]));

  const spentByCat: Record<string, number> = {};
  for (const e of egresos ?? []) {
    const catId = e.categoria_id ?? catByName.get(e.categoria) ?? null;
    if (catId) {
      spentByCat[catId] = (spentByCat[catId] || 0) + Number(e.monto);
    }
  }

  const result = (presupuestos ?? []).map((p) => {
    const cat = p.gastos_categorias as unknown as { id: string; nombre: string; color: string; icono: string } | null;
    return {
      id: p.id,
      monto: Number(p.monto),
      mes: p.mes,
      anio: p.anio,
      centro_costo: p.centro_costo,
      categoria_id: p.categoria_id,
      categoria: cat ? { id: cat.id, nombre: cat.nombre, color: cat.color, icono: cat.icono } : null,
      gastado: spentByCat[p.categoria_id] ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const categoria_id = String(body.categoria_id ?? "").trim();
  const monto = Number(body.monto);
  const mes = Number(body.mes);
  const anio = Number(body.anio);
  const centro_costo = body.centro_costo ? String(body.centro_costo).trim() : null;

  if (!categoria_id || isNaN(monto) || monto <= 0 || mes < 1 || mes > 12 || anio < 2020 || anio > 2100) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Upsert: si ya existe presupuesto para esa categoria/mes/anio, actualizar
  let existingQuery = supabase
    .from("gastos_presupuestos")
    .select("id")
    .eq("categoria_id", categoria_id)
    .eq("mes", mes)
    .eq("anio", anio);

  existingQuery = centro_costo !== null
    ? existingQuery.eq("centro_costo", centro_costo)
    : existingQuery.is("centro_costo", null);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("gastos_presupuestos")
      .update({ monto })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase
    .from("gastos_presupuestos")
    .insert([{
      categoria_id,
      monto,
      mes,
      anio,
      centro_costo,
      creado_por: session.userId === "legacy-admin" ? null : session.userId,
    }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("gastos_presupuestos")
    .delete()
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

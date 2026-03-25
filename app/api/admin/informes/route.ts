import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* ── GET /api/admin/informes — listar informes ──────────────── */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabase();
  const url = new URL(req.url);
  const estado = url.searchParams.get("estado") || "";
  const servicio = url.searchParams.get("servicio_tipo") || "";
  const busqueda = url.searchParams.get("busqueda") || "";

  let query = supabase
    .from("informes")
    .select("id,codigo,titulo,tipo,servicio_tipo,obra,cliente_nombre,cliente_empresa,estado,fecha_trabajo,created_at,responsable_id")
    .order("created_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }
  if (servicio) {
    query = query.eq("servicio_tipo", servicio);
  }
  if (busqueda) {
    const q = busqueda.trim();
    query = query.or(
      `titulo.ilike.%${q}%,obra.ilike.%${q}%,cliente_nombre.ilike.%${q}%,cliente_empresa.ilike.%${q}%,codigo.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/* ── POST /api/admin/informes — crear informe ───────────────── */
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "operaciones"])) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  if (!body.titulo || typeof body.titulo !== "string" || !body.titulo.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 422 });
  }

  const supabase = getSupabase();

  const payload: Record<string, unknown> = {
    titulo: body.titulo,
    tipo: body.tipo || "tecnico",
    servicio_tipo: body.servicio_tipo || null,
    obra: body.obra || null,
    ubicacion: body.ubicacion || null,
    fecha_trabajo: body.fecha_trabajo || null,
    cliente_nombre: body.cliente_nombre || null,
    cliente_empresa: body.cliente_empresa || null,
    cliente_email: body.cliente_email || null,
    responsable_id: session.userId,
    estado: body.estado === "emitido" ? "emitido" : "borrador",
    descripcion_trabajos: body.descripcion_trabajos || null,
    contenido_json: body.contenido_json || {},
    contenido_html: body.contenido_html || null,
  };

  const { data, error } = await supabase
    .from("informes")
    .insert(payload)
    .select("id, codigo")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: (data as { id: string }).id, codigo: (data as { id: string; codigo: string }).codigo },
    { status: 201 },
  );
}

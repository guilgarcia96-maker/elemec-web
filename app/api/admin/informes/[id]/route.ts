import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* ── GET /api/admin/informes/[id] — detalle de informe ──────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  const { data: informe, error } = await supabase
    .from("informes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  // Obtener adjuntos
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("*")
    .eq("informe_id", id)
    .order("orden", { ascending: true });

  // Obtener nombre del responsable
  let responsable_nombre: string | null = null;
  if (informe.responsable_id) {
    const { data: user } = await supabase
      .from("admin_users")
      .select("nombre")
      .eq("id", informe.responsable_id)
      .maybeSingle();
    responsable_nombre = user?.nombre ?? null;
  }

  return NextResponse.json({
    ...informe,
    adjuntos: adjuntos ?? [],
    responsable_nombre,
  });
}

/* ── PATCH /api/admin/informes/[id] — actualizar informe ────── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasAnyRole(session, ["admin", "operaciones"])) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const supabase = getSupabase();

  const ALLOWED = new Set([
    "titulo", "tipo", "servicio_tipo", "obra", "ubicacion",
    "fecha_trabajo", "cliente_nombre", "cliente_empresa",
    "contenido_json", "contenido_html", "estado", "resumen",
  ]);

  const ESTADOS_VALIDOS = new Set(["borrador", "emitido", "aprobado", "archivado"]);

  const updatePayload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key)) {
      if (key === "estado" && !ESTADOS_VALIDOS.has(value as string)) continue;
      updatePayload[key] = value === "" ? null : value;
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
  }

  const { error } = await supabase
    .from("informes")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/* ── DELETE /api/admin/informes/[id] — eliminar informe ─────── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Solo admin puede eliminar informes" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabase();

  // Verificar que existe y está en borrador
  const { data: informe, error: fetchError } = await supabase
    .from("informes")
    .select("id, estado")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  if (informe.estado !== "borrador") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar informes en estado borrador" },
      { status: 422 },
    );
  }

  // Eliminar adjuntos de Storage
  const { data: adjuntos } = await supabase
    .from("informe_adjuntos")
    .select("id, storage_path, storage_bucket")
    .eq("informe_id", id);

  if (adjuntos && adjuntos.length > 0) {
    const byBucket: Record<string, string[]> = {};
    for (const adj of adjuntos) {
      if (adj.storage_path) {
        const bucket = adj.storage_bucket ?? "backoffice-docs";
        if (!byBucket[bucket]) byBucket[bucket] = [];
        byBucket[bucket].push(adj.storage_path);
      }
    }
    for (const [bucket, paths] of Object.entries(byBucket)) {
      await supabase.storage.from(bucket).remove(paths);
    }
    await supabase.from("informe_adjuntos").delete().eq("informe_id", id);
  }

  // Eliminar informe
  const { error: deleteError } = await supabase
    .from("informes")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

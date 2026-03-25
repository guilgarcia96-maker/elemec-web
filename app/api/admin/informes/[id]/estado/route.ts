import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

type Estado = "borrador" | "emitido" | "aprobado" | "archivado";

// Transiciones válidas: clave = estado actual, valor = conjunto de estados destino permitidos
const TRANSICIONES: Record<Estado, Set<Estado>> = {
  borrador:  new Set(["emitido"]),
  emitido:   new Set(["aprobado", "borrador"]),
  aprobado:  new Set(["archivado", "borrador"]),
  archivado: new Set(["borrador"]),
};

const ESTADOS_VALIDOS = new Set<Estado>(["borrador", "emitido", "aprobado", "archivado"]);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* ── POST /api/admin/informes/[id]/estado ───────────────────────── */
export async function POST(
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

  let body: { estado?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const nuevoEstado = body.estado as string;
  if (!ESTADOS_VALIDOS.has(nuevoEstado as Estado)) {
    return NextResponse.json(
      { error: `Estado inválido. Valores permitidos: ${[...ESTADOS_VALIDOS].join(", ")}` },
      { status: 422 },
    );
  }

  const supabase = getSupabase();

  // Verificar estado actual
  const { data: informe, error: fetchError } = await supabase
    .from("informes")
    .select("id, estado")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !informe) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  const estadoActual = informe.estado as Estado;
  const permitidos = TRANSICIONES[estadoActual];

  if (!permitidos?.has(nuevoEstado as Estado)) {
    return NextResponse.json(
      {
        error: `Transición no permitida: ${estadoActual} → ${nuevoEstado}. Transiciones válidas desde "${estadoActual}": ${[...(permitidos ?? [])].join(", ") || "ninguna"}`,
      },
      { status: 422 },
    );
  }

  const { error: updateError } = await supabase
    .from("informes")
    .update({ estado: nuevoEstado })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}

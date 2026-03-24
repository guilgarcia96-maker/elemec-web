import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const TIPOS    = ["ingreso", "egreso"];
const ESTADOS  = ["pendiente", "conciliado", "observado"];

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const tipo      = String(body.tipo ?? "").trim();
  const fecha     = String(body.fecha ?? "").trim();
  const categoria = String(body.categoria ?? "").trim().slice(0, 200);
  const monto     = Number(body.monto);

  if (!TIPOS.includes(tipo) || !fecha || !categoria || isNaN(monto) || monto <= 0) {
    return NextResponse.json({ error: "Datos obligatorios faltantes o inválidos." }, { status: 400 });
  }

  const insert = {
    tipo,
    fecha,
    categoria,
    subcategoria:  String(body.subcategoria  ?? "").slice(0, 200) || null,
    descripcion:   String(body.descripcion   ?? "").slice(0, 500) || null,
    referencia:    String(body.referencia    ?? "").slice(0, 100) || null,
    centro_costo:  String(body.centro_costo  ?? "").slice(0, 100) || null,
    monto,
    moneda:  "CLP",
    estado:  "pendiente",
    notas:   String(body.notas ?? "").slice(0, 2000) || null,
    creado_por: session.userId === "legacy-admin" ? null : session.userId,
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inserted, error } = await supabase
    .from("conciliacion_movimientos")
    .insert([insert])
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("conciliacion insert error:", error?.message);
    return NextResponse.json({ error: "Error al guardar el movimiento." }, { status: 500 });
  }

  // Vincular adjunto si viene un storage_path (flujo OCR)
  const rawStoragePath = String(body.storagePath ?? "").trim();
  if (rawStoragePath) {
    const fileName = rawStoragePath.split("/").pop() ?? rawStoragePath;
    const { error: adjError } = await supabase.from("conciliacion_adjuntos").insert([{
      movimiento_id: inserted.id,
      nombre_archivo: fileName,
      mime_type: "image/jpeg",
      storage_bucket: "backoffice-docs",
      storage_path: rawStoragePath,
      tipo: "respaldo",
      subido_por: session.userId === "legacy-admin" ? null : session.userId,
    }]);
    if (adjError) {
      console.error("conciliacion_adjuntos insert error:", adjError.message);
      // No fallo la respuesta: el movimiento ya se guardó
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}

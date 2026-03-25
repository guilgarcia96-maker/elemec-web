import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

const TIPOS   = ["ingreso", "egreso"];
// ESTADOS se define pero no se usa en POST; se mantiene para uso futuro / GET
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ESTADOS = ["pendiente", "conciliado", "observado"];

const parseOptionalNumber = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

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

  const TIPOS_DOC_VALIDOS   = ["boleta", "factura", "factura_exenta", "nota_credito", "guia_despacho"];
  const FORMAS_PAGO_VALIDAS = ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito", "cheque", "otro"];

  const tipoDoc   = String(body.tipo_documento ?? "").trim();
  const formaPago = String(body.forma_pago ?? "").trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolver categoria_id
  let categoriaId: string | null = body.categoria_id ? String(body.categoria_id).trim() : null;
  if (!categoriaId && categoria) {
    // Buscar por nombre en gastos_categorias
    const { data: catMatch } = await supabase
      .from("gastos_categorias")
      .select("id")
      .ilike("nombre", categoria)
      .maybeSingle();
    if (catMatch?.id) categoriaId = catMatch.id;
  }

  const insert = {
    tipo,
    fecha,
    categoria,
    categoria_id:  categoriaId,
    subcategoria:  String(body.subcategoria  ?? "").slice(0, 200) || null,
    descripcion:   String(body.descripcion   ?? "").slice(0, 500) || null,
    referencia:    String(body.referencia    ?? "").slice(0, 100) || null,
    centro_costo:  String(body.centro_costo  ?? "").slice(0, 100) || null,
    monto,
    moneda:  "CLP",
    estado:  "pendiente",
    notas:   String(body.notas ?? "").slice(0, 2000) || null,
    creado_por: session.userId === "legacy-admin" ? null : session.userId,
    rut_emisor:          String(body.rut_emisor ?? "").slice(0, 20) || null,
    razon_social_emisor: String(body.razon_social_emisor ?? "").slice(0, 200) || null,
    tipo_documento:      TIPOS_DOC_VALIDOS.includes(tipoDoc) ? tipoDoc : null,
    monto_neto:          parseOptionalNumber(body.monto_neto),
    monto_iva:           parseOptionalNumber(body.monto_iva),
    monto_total:         parseOptionalNumber(body.monto_total),
    forma_pago:          FORMAS_PAGO_VALIDAS.includes(formaPago) ? formaPago : null,
    rut_receptor:        String(body.rut_receptor ?? "").slice(0, 20) || null,
  };

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
    const ext = rawStoragePath.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      jpg:  "image/jpeg",
      jpeg: "image/jpeg",
      png:  "image/png",
      webp: "image/webp",
      pdf:  "application/pdf",
    };
    const mimeType = mimeMap[ext] ?? "application/octet-stream";

    const { error: adjError } = await supabase.from("conciliacion_adjuntos").insert([{
      movimiento_id:  inserted.id,
      nombre_archivo: fileName,
      mime_type:      mimeType,
      storage_bucket: "backoffice-docs",
      storage_path:   rawStoragePath,
      tipo:           "respaldo",
      subido_por:     session.userId === "legacy-admin" ? null : session.userId,
    }]);
    if (adjError) {
      console.error("conciliacion_adjuntos insert error:", adjError.message);
      // No fallo la respuesta: el movimiento ya se guardó
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}

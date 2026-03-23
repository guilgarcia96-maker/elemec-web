import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

/* ── allowed fields on cotizaciones ──────────────────────────────────── */
const COTIZACION_FIELDS = new Set([
  "nombre","apellidos","compania","rut_empresa","cargo",
  "email","movil","telefono",
  "nombre_obra","fecha_inicio","direccion","region","comuna","ciudad",
  "tipo_obra","tipo_servicio","comentarios","notas",
  "monto_estimado","prioridad","origen","fecha_cierre_estimada",
  // extended fields
  "tipo_documento","sucursal","giro","glosa","vendedor",
  "lista_precio","observaciones","contacto","nombre_dir",
  "moneda","subtotal","descuentos","impuestos","total",
  // condiciones comerciales
  "condicion_venta","fecha_vencimiento","fecha_validez",
  // v2 extended
  "canal","margen_estimado","probabilidad_cierre","motivo_perdida",
  // workflow
  "solicitud_id","ejecutivo_id",
]);

/* ── allowed fields on cotizacion_items ──────────────────────────────── */
const ITEM_FIELDS = new Set([
  "item_num","descripcion","unidad","cantidad","precio_unitario",
  "descuento_pct","tipo_impuesto","impuesto_pct","subtotal","total",
  "servicio_id","alcance_id","sku","metadata",
]);

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  // For 'proceso' drafts validation is relaxed — only cotizada+ requires complete data
  const isBorrador = body.estado === "proceso";
  if (!isBorrador) {
    if (!body.compania && !body.nombre) {
      return NextResponse.json({ error: "Se requiere el nombre o razón social del cliente" }, { status: 422 });
    }
    if (!body.nombre_obra) {
      return NextResponse.json({ error: "El nombre de la obra/proyecto es obligatorio" }, { status: 422 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* ── 1. Build cotizacion payload ──────────────────────────────────── */
  const ESTADOS_VALIDOS = new Set(["proceso","nueva","en_revision","cotizada","ganada","perdida"]);
  const estadoIngresado = typeof body.estado === "string" && ESTADOS_VALIDOS.has(body.estado)
    ? body.estado
    : "cotizada";
  // Note: tipo_registro is NOT hardcoded here — the DB column default ('backoffice') handles it,
  // which also means inserts work even before the patch SQL is applied.
  const cotizPayload: Record<string, unknown> = { estado: estadoIngresado };
  for (const [key, value] of Object.entries(body)) {
    if (COTIZACION_FIELDS.has(key) && value !== undefined && value !== null && value !== "") {
      cotizPayload[key] = value;
    }
  }

  // fecha fields normalisation
  if (body.fecha) cotizPayload["fecha_inicio"] = body.fecha;
  if (body.fecha_vigencia) cotizPayload["fecha_cierre_estimada"] = body.fecha_vigencia;
  // ensure descuentos synced to main table
  if (body.descuentos !== undefined) cotizPayload["descuentos"] = body.descuentos;

  /* ── 2. Insert cotización ─────────────────────────────────────────── */
  const { data: cotizData, error: cotizError } = await supabase
    .from("cotizaciones")
    .insert(cotizPayload)
    .select("id, codigo")
    .single();

  if (cotizError) {
    return NextResponse.json({ error: cotizError.message }, { status: 500 });
  }

  const cotizId     = (cotizData as { id: string; codigo?: string }).id;
  const cotizCodigo = (cotizData as { id: string; codigo?: string }).codigo ?? null;

  /* ── 3. Create version ────────────────────────────────────────────── */
  const version: Record<string, unknown> = {
    cotizacion_id:          cotizId,
    version_num:            1,
    estado:                 "borrador",
    moneda:                 body.moneda ?? "CLP",
    subtotal:               body.subtotal ?? 0,
    impuestos:              body.impuestos ?? 0,
    total:                  body.total ?? 0,
    descuentos:             0,
    condiciones_comerciales: body.condicion_venta ?? null,
    notas_internas:         body.observaciones ?? null,
    json_snapshot:          {
      referencias:          body.referencias ?? [],
      glosa:                body.glosa ?? null,
      vendedor:             body.vendedor ?? null,
      comision_pct:         body.comision_pct ?? null,
      lista_precio:         body.lista_precio ?? null,
      fecha_vencimiento:    body.fecha_vencimiento ?? null,
      tipo_cambio:          body.tipo_cambio ?? null,
    },
    creado_por:             session.userId,
  };

  const { data: verData, error: verError } = await supabase
    .from("cotizacion_versiones")
    .insert(version)
    .select("id")
    .single();

  if (verError) {
    // Non-fatal: version table may not exist yet in DB — still return cotizacion id
    console.error("cotizacion_versiones insert error:", verError.message);
    return NextResponse.json({ id: cotizId, codigo: cotizCodigo }, { status: 201 });
  }

  const versionId = (verData as { id: string }).id;

  /* ── 4. Insert items ──────────────────────────────────────────────── */
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length > 0) {
    const itemPayloads = rawItems.map((raw: Record<string, unknown>) => {
      const item: Record<string, unknown> = { cotizacion_version_id: versionId };
      for (const [key, value] of Object.entries(raw)) {
        if (ITEM_FIELDS.has(key) && value !== undefined && value !== null) {
          item[key] = value;
        }
      }
      return item;
    });

    const { error: itemsError } = await supabase
      .from("cotizacion_items")
      .insert(itemPayloads);

    if (itemsError) {
      console.error("cotizacion_items insert error:", itemsError.message);
      // Non-fatal: still return
    }
  }

  /* ── 5. Update cotizacion with version ref ────────────────────────── */
  await supabase
    .from("cotizaciones")
    .update({ version_actual: 1 })
    .eq("id", cotizId);
  /* ── 6. Email al cliente si estado = cotizada ────────────────────────── */
  if (
    estadoIngresado === "cotizada" &&
    body.email &&
    typeof body.email === "string" &&
    process.env.RESEND_API_KEY
  ) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const nombre = [body.nombre, body.apellidos].filter(Boolean).join(" ") || String(body.compania ?? "Cliente");
      const totalFmt = typeof body.total === "number"
        ? body.total.toLocaleString("es-CL", { minimumFractionDigits: 0 })
        : "0";
      const tipoDoc = body.tipo_documento ? `<tr><td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Tipo documento</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${body.tipo_documento}</td></tr>` : "";
      const emailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#111827;padding:20px 24px;border-radius:8px 8px 0 0">
            <p style="color:#f97316;font-size:20px;font-weight:700;letter-spacing:0.1em;margin:0">ELEMEC</p>
            <p style="color:#ffffff60;font-size:10px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px">Cotización formal</p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;background:#fff;border-radius:0 0 8px 8px">
            <p style="color:#111;margin:0 0 12px">Estimado/a <strong>${nombre}</strong>,</p>
            <p style="color:#444;margin:0 0 20px">A continuación encontrará los detalles de la cotización enviada por <strong>ELEMEC SPA.</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
              <tr><td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">N° Cotización</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0"><strong>${cotizCodigo ?? "Pendiente"}</strong></td></tr>
              ${tipoDoc}
              <tr><td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Proyecto / Obra</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${body.nombre_obra ?? ""}</td></tr>
              <tr><td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600">Total</td><td style="padding:8px 12px;font-size:16px;color:#ea580c;font-weight:700">$${totalFmt} CLP</td></tr>
            </table>
            <p style="color:#444;font-size:13px;margin:0 0 4px">Para consultas o más información:</p>
            <p style="margin:0 0 20px"><a href="mailto:contacto@elemec.cl" style="color:#f97316;text-decoration:none">contacto@elemec.cl</a> &nbsp;·&nbsp; <a href="tel:+56996492917" style="color:#f97316;text-decoration:none">+56 9 9649 2917</a></p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
            <p style="color:#999;font-size:11px;margin:0">ELEMEC SPA. &nbsp;·&nbsp; RUT 76.715.440-2 &nbsp;·&nbsp; Arturo Prat 1602, Punta Arenas</p>
          </div>
        </div>`;
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "ELEMEC <onboarding@resend.dev>",
        to: [body.email as string],
        subject: `Cotización ${cotizCodigo ?? ""} — ELEMEC SPA.`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error("[cotizaciones] email error:", emailErr);
      // Non-fatal: mail failure does not abort the response
    }
  }
  return NextResponse.json({ id: cotizId, codigo: cotizCodigo }, { status: 201 });
}
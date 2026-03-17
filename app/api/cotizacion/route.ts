import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const DEST_EMAIL = (process.env.COTIZACION_DEST_EMAIL ?? "contacto@elemec.cl")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const allowed = [
  "nombre", "apellidos", "compania", "rutEmpresa", "cargo",
  "email", "movil", "telefono", "nombreObra", "fechaInicio",
  "direccion", "region", "tipoObra", "tipoServicio", "comentarios",
  "servicioPrincipal", "alcances", "modalidad", "prioridad",
  "presupuestoEstimado", "plazoDeseado",
] as const;

const labels: Record<string, string> = {
  nombre: "Nombre",
  apellidos: "Apellidos",
  compania: "Compañía",
  rutEmpresa: "RUT Empresa",
  cargo: "Cargo",
  email: "Correo electrónico",
  movil: "Móvil",
  telefono: "Teléfono",
  nombreObra: "Nombre obra / proyecto",
  fechaInicio: "Fecha de inicio estimada",
  direccion: "Dirección",
  region: "Región",
  tipoObra: "Tipo de obra",
  tipoServicio: "Tipo de servicio",
  servicioPrincipal: "Servicio principal",
  alcances: "Alcances solicitados",
  modalidad: "Modalidad",
  prioridad: "Prioridad",
  presupuestoEstimado: "Presupuesto estimado",
  plazoDeseado: "Plazo deseado",
  comentarios: "Comentarios",
};

function parseAlcances(raw?: string) {
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => String(v).trim())
        .filter(Boolean)
        .slice(0, 40);
    }
  } catch {
    // noop
  }
  return [] as string[];
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildInsertData(data: Record<string, string>) {
  const alcances = parseAlcances(data.alcances);
  const comentariosConAlcance = [
    data.comentarios,
    data.modalidad ? `Modalidad: ${data.modalidad}` : "",
    data.prioridad ? `Prioridad: ${data.prioridad}` : "",
    data.presupuestoEstimado ? `Presupuesto estimado: ${data.presupuestoEstimado}` : "",
    data.plazoDeseado ? `Plazo deseado: ${data.plazoDeseado}` : "",
    alcances.length > 0 ? `Alcances seleccionados: ${alcances.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    nombre: data.nombre ?? null,
    apellidos: data.apellidos ?? null,
    compania: data.compania ?? null,
    rut_empresa: data.rutEmpresa ?? null,
    cargo: data.cargo ?? null,
    email: data.email ?? null,
    movil: data.movil ?? null,
    telefono: data.telefono ?? null,
    nombre_obra: data.nombreObra ?? null,
    fecha_inicio: data.fechaInicio ?? null,
    direccion: data.direccion ?? null,
    region: data.region ?? null,
    tipo_obra: data.tipoObra ?? null,
    tipo_servicio: data.servicioPrincipal ?? data.tipoServicio ?? null,
    comentarios: comentariosConAlcance || null,
    estado: "proceso",
    tipo_registro: "solicitud_cliente",
  };
}

function htmlEscape(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const canSendEmail = Boolean(resendApiKey && !resendApiKey.includes("XXXXXXXXXXXXXXXX"));
  const data: Record<string, string> = {};
  let archivos: File[] = [];

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    for (const key of allowed) {
      const value = formData.get(key);
      if (typeof value === "string") {
        data[key] = value.trim().slice(0, 4000);
      }
    }
    archivos = formData
      .getAll("archivos")
      .filter((f) => f instanceof File && f.size > 0)
      .slice(0, 8) as File[];
  } else {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    for (const key of allowed) {
      if (typeof body[key] === "string") {
        data[key] = (body[key] as string).trim().slice(0, 4000);
      }
    }
  }

  const alcances = parseAlcances(data.alcances);

  if (alcances.length > 0) {
    data.alcances = alcances.join(" | ");
  }

  const rows = allowed
    .filter((k) => data[k])
    .map((k) => `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap">${labels[k]}</td><td style="padding:6px 12px">${htmlEscape(data[k])}</td></tr>`)
    .join("");

  const filesRow = archivos.length
    ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap">Archivos adjuntos</td><td style="padding:6px 12px">${archivos.map((f) => htmlEscape(f.name)).join("<br/>")}</td></tr>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="background:#1a1a2e;color:#e2b44b;padding:16px 20px;border-radius:8px 8px 0 0;margin:0">
        Nueva cotización — ELEMEC
      </h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        ${rows}
        ${filesRow}
      </table>
      <p style="color:#999;font-size:12px;margin-top:12px">
        Enviado el ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}
      </p>
    </div>`;

  const insertData = buildInsertData(data);

  let cotizacionId: string | null = null;

  // Guardar en Supabase (paso principal del backoffice)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: inserted, error: dbError } = await supabase
      .from("cotizaciones")
      .insert([insertData])
      .select("id")
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError.message);
      return NextResponse.json({ error: "No se pudo guardar la cotización" }, { status: 500 });
    }

    cotizacionId = inserted?.id ?? null;

    if (cotizacionId && archivos.length > 0) {
      for (const file of archivos) {
        const fileBytes = Buffer.from(await file.arrayBuffer());
        const safeName = sanitizeFileName(file.name);
        const storagePath = `cotizaciones/${cotizacionId}/cliente-${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("backoffice-docs")
          .upload(storagePath, fileBytes, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("Client attachment upload error:", uploadError.message);
          continue;
        }

        const { error: attachError } = await supabase.from("cotizacion_adjuntos").insert([
          {
            cotizacion_id: cotizacionId,
            nombre_archivo: file.name,
            mime_type: file.type || "application/octet-stream",
            tamano_bytes: file.size,
            storage_bucket: "backoffice-docs",
            storage_path: storagePath,
            descripcion: "Adjunto enviado por cliente",
          },
        ]);

        if (attachError) {
          console.error("Client attachment metadata error:", attachError.message);
        }
      }
    }
  }

  if (canSendEmail) {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: "Cotizaciones ELEMEC <onboarding@resend.dev>",
      to: DEST_EMAIL,
      subject: `Nueva cotización de ${data.nombre ?? ""} ${data.apellidos ?? ""}`.trim(),
      html,
      replyTo: data.email,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}


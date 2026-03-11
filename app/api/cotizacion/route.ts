import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const DEST_EMAIL = (process.env.COTIZACION_DEST_EMAIL ?? "contacto@elemec.cl")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const allowed = [
  "nombre", "apellidos", "compania", "rutEmpresa", "cargo",
  "email", "movil", "telefono", "nombreObra", "fechaInicio",
  "direccion", "region", "tipoObra", "tipoServicio", "comentarios",
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
  comentarios: "Comentarios",
};

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está definida");
    return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (typeof body[key] === "string") {
      data[key] = (body[key] as string).trim().slice(0, 2000);
    }
  }

  const rows = allowed
    .filter((k) => data[k])
    .map((k) => `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap">${labels[k]}</td><td style="padding:6px 12px">${data[k]}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="background:#1a1a2e;color:#e2b44b;padding:16px 20px;border-radius:8px 8px 0 0;margin:0">
        Nueva cotización — ELEMEC
      </h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        ${rows}
      </table>
      <p style="color:#999;font-size:12px;margin-top:12px">
        Enviado el ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}
      </p>
    </div>`;

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

  return NextResponse.json({ ok: true });
}

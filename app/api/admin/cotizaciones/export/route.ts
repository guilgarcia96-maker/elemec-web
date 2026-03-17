import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

const ESTADOS = ["nueva", "en_revision", "cotizada", "ganada", "perdida"];

const LABEL: Record<string, string> = {
  nueva:       "Nueva",
  en_revision: "En revisión",
  cotizada:    "Cotizada",
  ganada:      "Ganada",
  perdida:     "Perdida",
};

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const estado   = searchParams.get("estado")   ?? "";
  const busqueda = searchParams.get("busqueda") ?? "";
  const desde    = searchParams.get("desde")    ?? "";
  const hasta    = searchParams.get("hasta")    ?? "";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("cotizaciones")
    .select(
      "id,nombre,apellidos,compania,rut_empresa,cargo,email,movil,telefono," +
      "nombre_obra,fecha_inicio,direccion,region,tipo_obra,tipo_servicio," +
      "comentarios,estado,monto_estimado,created_at"
    )
    .order("created_at", { ascending: false });

  if (estado && ESTADOS.includes(estado)) {
    query = query.eq("estado", estado);
  }
  if (busqueda) {
    const q = busqueda.trim();
    query = query.or(
      `nombre.ilike.%${q}%,apellidos.ilike.%${q}%,email.ilike.%${q}%,compania.ilike.%${q}%`
    );
  }
  if (desde) {
    query = query.gte("created_at", desde);
  }
  if (hasta) {
    query = query.lte("created_at", hasta + "T23:59:59.999Z");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data as unknown as Array<Record<string, unknown>>) ?? [];

  const headers = [
    "ID", "Nombre", "Apellidos", "Compañía", "RUT Empresa", "Cargo",
    "Email", "Móvil", "Teléfono", "Obra / Proyecto", "Fecha Inicio",
    "Dirección", "Región", "Tipo Obra", "Tipo Servicio", "Comentarios",
    "Estado", "Monto Estimado", "Fecha Solicitud",
  ];

  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.nombre,
        r.apellidos,
        r.compania,
        r.rut_empresa,
        r.cargo,
        r.email,
        r.movil,
        r.telefono,
        r.nombre_obra,
        r.fecha_inicio,
        r.direccion,
        r.region,
        r.tipo_obra,
        r.tipo_servicio,
        r.comentarios,
        LABEL[r.estado as string] ?? r.estado,
        r.monto_estimado ?? "",
        new Date(r.created_at as string).toLocaleDateString("es-CL"),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  // UTF-8 BOM so Excel opens Chilean characters correctly
  const csv = "\uFEFF" + csvLines.join("\r\n");
  const filename = `cotizaciones_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

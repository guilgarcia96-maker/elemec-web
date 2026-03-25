import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSessionFromRequest, hasAnyRole } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasAnyRole(session, ["admin", "contabilidad"])) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: egresos } = await supabase
    .from("conciliacion_movimientos")
    .select("fecha, descripcion, categoria, subcategoria, monto, referencia, centro_costo, categoria_id, rut_emisor, razon_social_emisor, tipo_documento, monto_neto, monto_iva, monto_total, forma_pago, rut_receptor")
    .eq("tipo", "egreso")
    .gte("fecha", startDate)
    .lt("fecha", endDate)
    .order("fecha", { ascending: true });

  // Resolver nombres de categoría
  const { data: categoriasDB } = await supabase
    .from("gastos_categorias")
    .select("id, nombre");
  const catMap = new Map((categoriasDB ?? []).map(c => [c.id, c.nombre]));

  const rows = egresos ?? [];
  const TIPO_DOC_LABELS: Record<string, string> = {
    boleta: "Boleta",
    factura: "Factura",
    factura_exenta: "Factura Exenta",
    nota_credito: "Nota de Crédito",
    guia_despacho: "Guía de Despacho",
  };

  const FORMA_PAGO_LABELS: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta_debito: "Tarjeta Débito",
    tarjeta_credito: "Tarjeta Crédito",
    cheque: "Cheque",
    otro: "Otro",
  };

  const headers = [
    "Fecha",
    "Descripcion",
    "Categoria",
    "Subcategoria",
    "Monto",
    "Referencia",
    "Centro de Costo",
    "RUT Emisor",
    "Razon Social",
    "Tipo Documento",
    "Monto Neto",
    "Monto IVA",
    "Monto Total",
    "Forma de Pago",
    "RUT Receptor",
  ];

  const csvLines = [
    headers.join(","),
    ...rows.map((r) => {
      const catName = r.categoria_id ? (catMap.get(r.categoria_id) ?? r.categoria ?? "") : (r.categoria ?? "");
      return [
        r.fecha,
        `"${(r.descripcion ?? "").replace(/"/g, '""')}"`,
        `"${catName.replace(/"/g, '""')}"`,
        `"${(r.subcategoria ?? "").replace(/"/g, '""')}"`,
        r.monto,
        `"${(r.referencia ?? "").replace(/"/g, '""')}"`,
        `"${(r.centro_costo ?? "").replace(/"/g, '""')}"`,
        `"${(r.rut_emisor ?? "").replace(/"/g, '""')}"`,
        `"${(r.razon_social_emisor ?? "").replace(/"/g, '""')}"`,
        `"${r.tipo_documento ? (TIPO_DOC_LABELS[r.tipo_documento] ?? r.tipo_documento) : ""}"`,
        r.monto_neto ?? "",
        r.monto_iva ?? "",
        r.monto_total ?? "",
        `"${r.forma_pago ? (FORMA_PAGO_LABELS[r.forma_pago] ?? r.forma_pago) : ""}"`,
        `"${(r.rut_receptor ?? "").replace(/"/g, '""')}"`,
      ].join(",");
    }),
  ];

  const csv = csvLines.join("\n");
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const filename = `gastos_${monthNames[month - 1]}_${year}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

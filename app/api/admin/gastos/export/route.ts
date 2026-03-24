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
    .select("fecha, descripcion, categoria, subcategoria, monto, referencia, centro_costo, categoria_id")
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
  const headers = ["Fecha", "Descripcion", "Categoria", "Subcategoria", "Monto", "Referencia", "Centro de Costo"];

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

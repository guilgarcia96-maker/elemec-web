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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Rango del mes actual
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endYear = month === 12 ? year + 1 : year;
  const endMonth = month === 12 ? 1 : month + 1;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  // Rango del mes anterior
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;

  // Egresos del mes actual
  const { data: egresos } = await supabase
    .from("conciliacion_movimientos")
    .select("id, fecha, descripcion, categoria, subcategoria, referencia, centro_costo, monto, categoria_id")
    .eq("tipo", "egreso")
    .gte("fecha", startDate)
    .lt("fecha", endDate)
    .order("fecha", { ascending: false });

  const expenses = egresos ?? [];

  // Egresos del mes anterior
  const { data: prevEgresos } = await supabase
    .from("conciliacion_movimientos")
    .select("monto")
    .eq("tipo", "egreso")
    .gte("fecha", prevStartDate)
    .lt("fecha", startDate);

  const prevTotal = (prevEgresos ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const total = expenses.reduce((sum, e) => sum + Number(e.monto), 0);

  // Categorias de la DB
  const { data: categoriasDB } = await supabase
    .from("gastos_categorias")
    .select("id, nombre, color");
  const catMap = new Map((categoriasDB ?? []).map(c => [c.id, c]));
  const catByName = new Map((categoriasDB ?? []).map(c => [c.nombre, c]));

  // Por categoria
  const byCategoryMap: Record<string, { name: string; color: string; total: number; count: number }> = {};
  for (const e of expenses) {
    // Intentar resolver por categoria_id, si no por campo texto "categoria"
    const cat = e.categoria_id ? catMap.get(e.categoria_id) : catByName.get(e.categoria);
    const name = cat?.nombre ?? e.categoria ?? "Sin categoría";
    const color = cat?.color ?? "#6b7280";
    if (!byCategoryMap[name]) byCategoryMap[name] = { name, color, total: 0, count: 0 };
    byCategoryMap[name].total += Number(e.monto);
    byCategoryMap[name].count += 1;
  }
  const byCategory = Object.values(byCategoryMap).sort((a, b) => b.total - a.total);

  // Totales diarios
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const maxDay = (year === today.getFullYear() && month === today.getMonth() + 1)
    ? today.getDate()
    : daysInMonth;

  const dailyMap: Record<string, number> = {};
  for (const e of expenses) {
    const day = String(e.fecha);
    dailyMap[day] = (dailyMap[day] || 0) + Number(e.monto);
  }

  const dailyTotals: { date: string; amount: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let d = 1; d <= maxDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const amount = dailyMap[dateStr] || 0;
    cumulative += amount;
    dailyTotals.push({ date: dateStr, amount, cumulative });
  }

  // Totales semanales (4 semanas)
  const weeklyTotals: { week: string; amount: number }[] = [];
  for (let w = 3; w >= 0; w--) {
    const wEnd = new Date(today);
    wEnd.setDate(today.getDate() - w * 7);
    const wStart = new Date(wEnd);
    wStart.setDate(wEnd.getDate() - 6);
    const weekAmount = expenses
      .filter((e) => {
        const d = new Date(e.fecha);
        return d >= wStart && d <= wEnd;
      })
      .reduce((s, e) => s + Number(e.monto), 0);
    const label = `${wStart.getDate()}/${wStart.getMonth() + 1}-${wEnd.getDate()}/${wEnd.getMonth() + 1}`;
    weeklyTotals.push({ week: label, amount: weekAmount });
  }

  // Presupuestos y alertas
  const { data: budgets } = await supabase
    .from("gastos_presupuestos")
    .select("id, monto, categoria_id")
    .eq("mes", month)
    .eq("anio", year);

  const alerts = (budgets ?? [])
    .map((b) => {
      const cat = catMap.get(b.categoria_id);
      const catName = cat?.nombre ?? "Desconocida";
      const spent = byCategoryMap[catName]?.total || 0;
      const pct = Number(b.monto) > 0 ? (spent / Number(b.monto)) * 100 : 0;
      return { category: catName, budget: Number(b.monto), spent, percentage: Math.round(pct) };
    })
    .filter((a) => a.percentage >= 80);

  // Mayor gasto
  const topExpense = expenses.length
    ? expenses.reduce((max, e) => (Number(e.monto) > Number(max.monto) ? e : max))
    : null;

  // Gastos recientes (10)
  const recentExpenses = expenses.slice(0, 10).map((e) => {
    const cat = e.categoria_id ? catMap.get(e.categoria_id) : catByName.get(e.categoria);
    return {
      id: e.id,
      amount: Number(e.monto),
      description: e.descripcion ?? e.categoria ?? "",
      date: e.fecha,
      referencia: e.referencia,
      category: {
        name: cat?.nombre ?? e.categoria ?? "Sin categoría",
        color: cat?.color ?? "#6b7280",
      },
    };
  });

  return NextResponse.json({
    total,
    prevTotal,
    count: expenses.length,
    byCategory,
    dailyTotals,
    weeklyTotals,
    alerts,
    recentExpenses,
    topExpense: topExpense
      ? {
          amount: Number(topExpense.monto),
          description: topExpense.descripcion ?? topExpense.categoria ?? "",
          category: (topExpense.categoria_id ? catMap.get(topExpense.categoria_id)?.nombre : topExpense.categoria) ?? "Sin categoría",
        }
      : null,
  });
}

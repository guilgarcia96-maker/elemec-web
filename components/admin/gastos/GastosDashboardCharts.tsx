"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  CartesianGrid,
} from "recharts";

interface Stats {
  total: number;
  prevTotal: number;
  count: number;
  byCategory: { name: string; color: string; total: number; count: number }[];
  dailyTotals: { date: string; amount: number; cumulative: number }[];
  weeklyTotals: { week: string; amount: number }[];
  alerts: { category: string; budget: number; spent: number; percentage: number }[];
  recentExpenses: {
    id: string;
    amount: number;
    description: string;
    date: string;
    referencia: string | null;
    category: { name: string; color: string };
  }[];
  topExpense: { amount: number; description: string; category: string } | null;
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const monthShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

type TabId = "diario" | "semanal" | "categorias";

const tabs: { id: TabId; label: string }[] = [
  { id: "diario", label: "Diario" },
  { id: "semanal", label: "Semanal" },
  { id: "categorias", label: "Categorias" },
];

export default function GastosDashboardCharts() {
  const [stats, setStats] = useState<Stats | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<TabId>("diario");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/gastos/stats?month=${month}&year=${year}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    return () => controller.abort();
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  if (!stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-gray-50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-50" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-gray-50" />
      </div>
    );
  }

  const monthDiff = stats.prevTotal > 0
    ? Math.round(((stats.total - stats.prevTotal) / stats.prevTotal) * 100)
    : null;

  const avgPerExpense = stats.count > 0 ? stats.total / stats.count : 0;

  return (
    <div className="space-y-5">
      {/* Navegacion mensual */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-medium text-orange-400">
            {monthShort[month - 1]}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-400">
            {year}
          </span>
          {stats.alerts.length > 0 && (
            <span className="px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-400">
              {stats.alerts.length} alerta{stats.alerts.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Exportar CSV */}
        <a
          href={`/api/admin/gastos/export?month=${month}&year=${year}`}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4 4 4-4M12 4v12" />
          </svg>
          Exportar CSV
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total del mes */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs text-orange-600 uppercase tracking-widest font-semibold">Total del Mes</p>
          <p className="text-2xl font-bold text-orange-600 mt-2 tabular-nums leading-tight">{CLP(stats.total)}</p>
          <div className="flex items-center gap-2 mt-2">
            {monthDiff !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                monthDiff > 0
                  ? "text-red-400 bg-red-500/10"
                  : "text-green-400 bg-green-500/10"
              }`}>
                {monthDiff > 0 ? "+" : ""}{monthDiff}%
              </span>
            )}
            <p className="text-xs text-orange-400">vs {CLP(stats.prevTotal)} anterior</p>
          </div>
        </div>

        {/* Transacciones */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs text-blue-600 uppercase tracking-widest font-semibold">Transacciones</p>
          <p className="text-4xl font-bold text-blue-600 mt-2 tabular-nums">{stats.count}</p>
          <p className="text-xs text-blue-400 mt-2">{stats.byCategory.length} categorias activas</p>
        </div>

        {/* Promedio */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <p className="text-xs text-purple-600 uppercase tracking-widest font-semibold">Promedio por Gasto</p>
          <p className="text-2xl font-bold text-purple-600 mt-2 tabular-nums leading-tight">{CLP(avgPerExpense)}</p>
          <p className="text-xs text-purple-400 mt-2">{monthNames[month - 1]} {year}</p>
        </div>

        {/* Top categoria */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-xs text-green-600 uppercase tracking-widest font-semibold">Mayor Gasto</p>
          {stats.topExpense ? (
            <>
              <p className="text-2xl font-bold text-green-600 mt-2 tabular-nums leading-tight">
                {CLP(stats.topExpense.amount)}
              </p>
              <p className="text-xs text-green-400 mt-2 truncate">{stats.topExpense.description}</p>
            </>
          ) : (
            <p className="text-sm text-green-400 mt-2">Sin gastos</p>
          )}
        </div>
      </div>

      {/* Alertas de presupuesto */}
      {stats.alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Alertas de Presupuesto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.alerts.map((a) => (
              <div key={a.category} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.percentage >= 100 ? "bg-red-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{a.category}</p>
                  <p className="text-[10px] text-gray-400">
                    {CLP(a.spent)} / {CLP(a.budget)}
                  </p>
                </div>
                <span className={`text-xs font-semibold tabular-nums ${
                  a.percentage >= 100 ? "text-red-400" : "text-amber-400"
                }`}>
                  {a.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs de graficos */}
      <div className="rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center border-b border-gray-200 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-orange-400"
                  : "text-gray-400 hover:text-gray-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "diario" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">Gasto acumulado del mes</p>
                {stats.dailyTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.dailyTotals}>
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => v.slice(8)} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Acumulado"]}
                        labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#111827" }}
                      />
                      <Area type="monotone" dataKey="cumulative" stroke="#f97316" strokeWidth={1.5} fill="url(#cumGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-300">Sin datos</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">Gastos por dia</p>
                {stats.dailyTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.dailyTotals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => v.slice(8)} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Monto"]}
                        labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#111827" }}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-300">Sin datos</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "semanal" && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-3">Gastos por semana</p>
              {stats.weeklyTotals.some((w) => w.amount > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.weeklyTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      formatter={(v) => [CLP(Number(v)), "Total"]}
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#111827" }}
                    />
                    <Bar dataKey="amount" name="Gasto semanal" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-300">Sin datos semanales</p>
              )}
            </div>
          )}

          {activeTab === "categorias" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">Distribucion por categoria</p>
                {stats.byCategory.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="45%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.byCategory}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={42}
                          strokeWidth={0}
                        >
                          {stats.byCategory.map((c) => (
                            <Cell key={c.name} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [CLP(Number(v))]}
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#111827" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm flex-1">
                      {stats.byCategory.map((c) => {
                        const pct = stats.total > 0 ? Math.round((c.total / stats.total) * 100) : 0;
                        return (
                          <div key={c.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="flex-1 text-xs text-gray-500 truncate">{c.name}</span>
                            <span className="text-xs text-gray-400 tabular-nums">{CLP(c.total)}</span>
                            <span className="text-xs text-gray-300 w-7 text-right tabular-nums">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">Sin datos</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">Comparativa por categoria</p>
                {stats.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} width={90} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Total"]}
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px", color: "#111827" }}
                      />
                      <Bar dataKey="total" radius={[0, 3, 3, 0]}>
                        {stats.byCategory.map((c) => (
                          <Cell key={c.name} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-300">Sin datos</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones recientes */}
      {stats.recentExpenses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Ultimos Gastos</h3>
          <div className="divide-y divide-gray-100">
            {stats.recentExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: exp.category.color + "20" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: exp.category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{exp.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: exp.category.color }} />
                    <p className="text-xs text-gray-400 truncate">
                      {exp.category.name} · {new Date(exp.date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 tabular-nums shrink-0">
                  {CLP(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

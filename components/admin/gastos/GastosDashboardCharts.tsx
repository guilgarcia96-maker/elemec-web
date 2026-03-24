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
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-white/5" />
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
          className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-medium text-orange-400">
            {monthShort[month - 1]}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/50">
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
          className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Exportar CSV */}
        <a
          href={`/api/admin/gastos/export?month=${month}&year=${year}`}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition"
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
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/8 p-5">
          <p className="text-xs text-orange-300/70 uppercase tracking-widest font-semibold">Total del Mes</p>
          <p className="text-2xl font-bold text-orange-200 mt-2 tabular-nums leading-tight">{CLP(stats.total)}</p>
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
            <p className="text-xs text-orange-300/50">vs {CLP(stats.prevTotal)} anterior</p>
          </div>
        </div>

        {/* Transacciones */}
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 p-5">
          <p className="text-xs text-blue-300/70 uppercase tracking-widest font-semibold">Transacciones</p>
          <p className="text-4xl font-bold text-blue-200 mt-2 tabular-nums">{stats.count}</p>
          <p className="text-xs text-blue-300/50 mt-2">{stats.byCategory.length} categorias activas</p>
        </div>

        {/* Promedio */}
        <div className="rounded-xl border border-purple-500/25 bg-purple-500/8 p-5">
          <p className="text-xs text-purple-300/70 uppercase tracking-widest font-semibold">Promedio por Gasto</p>
          <p className="text-2xl font-bold text-purple-200 mt-2 tabular-nums leading-tight">{CLP(avgPerExpense)}</p>
          <p className="text-xs text-purple-300/50 mt-2">{monthNames[month - 1]} {year}</p>
        </div>

        {/* Top categoria */}
        <div className="rounded-xl border border-green-500/25 bg-green-500/8 p-5">
          <p className="text-xs text-green-300/70 uppercase tracking-widest font-semibold">Mayor Gasto</p>
          {stats.topExpense ? (
            <>
              <p className="text-2xl font-bold text-green-200 mt-2 tabular-nums leading-tight">
                {CLP(stats.topExpense.amount)}
              </p>
              <p className="text-xs text-green-300/50 mt-2 truncate">{stats.topExpense.description}</p>
            </>
          ) : (
            <p className="text-sm text-green-300/40 mt-2">Sin gastos</p>
          )}
        </div>
      </div>

      {/* Alertas de presupuesto */}
      {stats.alerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Alertas de Presupuesto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.alerts.map((a) => (
              <div key={a.category} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.percentage >= 100 ? "bg-red-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">{a.category}</p>
                  <p className="text-[10px] text-white/40">
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
      <div className="rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center border-b border-white/10 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-orange-400"
                  : "text-white/40 hover:text-white/70"
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
                <p className="text-xs font-medium text-white/40 mb-3">Gasto acumulado del mes</p>
                {stats.dailyTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.dailyTotals}>
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v.slice(8)} />
                      <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Acumulado"]}
                        labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                      />
                      <Area type="monotone" dataKey="cumulative" stroke="#f97316" strokeWidth={1.5} fill="url(#cumGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-white/30">Sin datos</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-white/40 mb-3">Gastos por dia</p>
                {stats.dailyTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.dailyTotals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v.slice(8)} />
                      <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Monto"]}
                        labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-white/30">Sin datos</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "semanal" && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-3">Gastos por semana</p>
              {stats.weeklyTotals.some((w) => w.amount > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.weeklyTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} />
                    <Tooltip
                      formatter={(v) => [CLP(Number(v)), "Total"]}
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                    />
                    <Bar dataKey="amount" name="Gasto semanal" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-white/30">Sin datos semanales</p>
              )}
            </div>
          )}

          {activeTab === "categorias" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-white/40 mb-3">Distribucion por categoria</p>
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
                          contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm flex-1">
                      {stats.byCategory.map((c) => {
                        const pct = stats.total > 0 ? Math.round((c.total / stats.total) * 100) : 0;
                        return (
                          <div key={c.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="flex-1 text-xs text-white/60 truncate">{c.name}</span>
                            <span className="text-xs text-white/40 tabular-nums">{CLP(c.total)}</span>
                            <span className="text-xs text-white/30 w-7 text-right tabular-nums">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/30">Sin datos</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-white/40 mb-3">Comparativa por categoria</p>
                {stats.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={90} />
                      <Tooltip
                        formatter={(v) => [CLP(Number(v)), "Total"]}
                        contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#fff" }}
                      />
                      <Bar dataKey="total" radius={[0, 3, 3, 0]}>
                        {stats.byCategory.map((c) => (
                          <Cell key={c.name} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-white/30">Sin datos</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones recientes */}
      {stats.recentExpenses.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Ultimos Gastos</h3>
          <div className="divide-y divide-white/5">
            {stats.recentExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 py-3 hover:bg-white/[0.03] rounded-lg px-2 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: exp.category.color + "20" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: exp.category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{exp.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: exp.category.color }} />
                    <p className="text-xs text-white/40 truncate">
                      {exp.category.name} · {new Date(exp.date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white/80 tabular-nums shrink-0">
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

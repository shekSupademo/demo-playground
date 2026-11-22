import { Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { PageHeader, Panel, Tabs } from "../components/ui";
import type { Category } from "../data/types";
import { CATEGORY_COLORS, daysAgoIso, monthlyInOut, spendByCategory, topMerchants } from "../lib/analytics";
import { money, moneyCompact, monthLabel } from "../lib/format";
import { useDemoVariants } from "../state/demoVariants";
import { useStore } from "../state/store";

type Range = "30" | "90" | "180";

const fieldnoteColors: Record<Category, string> = {
  Software: "#166534",
  Payroll: "#0f766e",
  Advertising: "#a16207",
  Travel: "#4d7c0f",
  Meals: "#be185d",
  Office: "#0369a1",
  Contractors: "#7c3aed",
  Rent: "#9a3412",
  Utilities: "#3f6212",
  Revenue: "#047857",
  Taxes: "#854d0e",
  Transfer: "#64748b",
  Uncategorized: "#a1a1aa",
};
const fieldnotePanel = "border-emerald-200 bg-emerald-50/25 dark:border-emerald-900 dark:bg-emerald-950/30";

export function Insights() {
  const { variants } = useDemoVariants();
  const fieldnote = variants.insights === "variant";
  const panelClass = fieldnote ? fieldnotePanel : undefined;
  const accent = fieldnote ? "#15803d" : "#6366f1";
  const { transactions } = useStore();
  const [range, setRange] = useState<Range>("90");
  const since = daysAgoIso(Number(range));
  const cats = useMemo(() => spendByCategory(transactions, since), [transactions, since]);
  const merchants = useMemo(() => topMerchants(transactions, since), [transactions, since]);
  const flows = useMemo(() => monthlyInOut(transactions, 6).map((f) => ({ ...f, net: f.moneyIn - f.moneyOut })), [transactions]);
  const totalSpend = cats.reduce((s, c) => s + c.amount, 0);

  const rangeTabs = <Tabs value={range} onChange={setRange} options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "180", label: "6 months" }]} />;
  const categoryColors = fieldnote ? fieldnoteColors : CATEGORY_COLORS;

  return (
    <div className="space-y-6">
      {fieldnote ? (
        <header className="flex flex-wrap items-end justify-between gap-6 rounded-2xl bg-emerald-950 p-6 text-emerald-50 sm:p-8">
          <div>
            <Leaf className="mb-3 size-7 text-lime-300" aria-hidden />
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Fieldnote Analytics</h1>
            <p className="mt-2 text-sm text-emerald-200">Track where your business spends and how cash moves over time.</p>
          </div>
          <div className="text-zinc-900 dark:text-zinc-100">{rangeTabs}</div>
        </header>
      ) : (
        <PageHeader title="Insights" subtitle="Where your money goes, and how it's trending." actions={rangeTabs} />
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className={panelClass} title={fieldnote ? "Spending breakdown" : "Spend by category"} data-testid="category-chart">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={cats} dataKey="amount" nameKey="category" innerRadius={72} outerRadius={100} paddingAngle={2} cornerRadius={4} stroke="none">
                    {cats.map((c) => (
                      <Cell key={c.category} fill={categoryColors[c.category]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-1.5 text-sm">
              {cats.map((c) => (
                <li key={c.category}>
                  <Link to={`/transactions?category=${encodeURIComponent(c.category)}`} className="flex items-center justify-between gap-2 rounded px-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: categoryColors[c.category] }} />
                      {c.category}
                    </span>
                    <span className="tabular text-zinc-500">
                      {money(c.amount)} · {((c.amount / totalSpend) * 100).toFixed(0)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel className={panelClass} title={fieldnote ? "Highest-spend vendors" : "Top vendors"}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchants} layout="vertical" margin={{ left: 24, right: 12 }}>
                <defs>
                  <linearGradient id="vendorBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tickFormatter={(v: number) => moneyCompact(v)} tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar isAnimationActive={false} dataKey="amount" name="Spend" fill={fieldnote ? accent : "url(#vendorBar)"} radius={[0, 8, 8, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel className={panelClass} title={fieldnote ? "Monthly cash movement" : "Net cash flow by month"}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flows} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} stroke="#e4e4e7" strokeOpacity={0.6} strokeDasharray="3 4" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => moneyCompact(v)} tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip formatter={(v: number) => money(v)} labelFormatter={(l: string) => monthLabel(l)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="moneyIn" name={fieldnote ? "Inflow" : "Money in"} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="moneyOut" name={fieldnote ? "Outflow" : "Money out"} stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="net" name="Net" stroke={accent} strokeWidth={2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getFinanceSummary, resolveRange, usd } from "@/lib/finance";
import { IncomeExpenseBars, Donut } from "@/components/admin/finance-charts";
import { MovementsTable, type MovementRow } from "./movement-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Finanzas" };

const PRESETS = [
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mes" },
  { key: "ano", label: "Este año" },
];

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function longDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Kpi({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "income" | "expense" | "balance";
}) {
  const color =
    tone === "income"
      ? "text-orchid-deep"
      : tone === "expense"
        ? "text-rose-deep"
        : tone === "balance"
          ? "text-ink"
          : "text-ink";

  return (
    <div className="card-soft p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function AdminFinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; desde?: string; hasta?: string }>;
}) {
  await requireAdmin();
  const { preset, desde, hasta } = await searchParams;

  const range = resolveRange(preset, desde, hasta);
  const [summary, movements] = await Promise.all([
    getFinanceSummary(range.from, range.to),
    db.movement.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 200 }),
  ]);

  const rows: MovementRow[] = movements.map((m) => ({
    id: m.id,
    kind: m.kind,
    concept: m.concept,
    category: m.category,
    amount: m.amount,
    method: m.method,
    date: isoDay(m.date),
    notes: m.notes,
  }));

  const exportHref =
    range.preset === "rango"
      ? `/api/admin/finanzas/export?preset=rango&desde=${summary.from}&hasta=${summary.to}`
      : `/api/admin/finanzas/export?preset=${range.preset}`;

  const margin =
    summary.kpis.income > 0 ? Math.round((summary.kpis.balance / summary.kpis.income) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted">Transversal</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Finanzas</h1>
          <p className="mt-2 text-ink-soft">
            Lo que entra por las dos unidades y lo que sale del negocio, en un solo balance.
          </p>
        </div>
        <a
          href={exportHref}
          className="rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
        >
          Exportar CSV
        </a>
      </header>

      {/* Rango */}
      <section className="card-soft flex flex-wrap items-center gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <a
              key={p.key}
              href={`/admin/finanzas?preset=${p.key}`}
              className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                range.preset === p.key
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-white hover:border-ink/40"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>

        <form action="/admin/finanzas" className="ml-auto flex flex-wrap items-center gap-2">
          <input type="hidden" name="preset" value="rango" />
          <input
            type="date"
            name="desde"
            defaultValue={summary.from}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
          />
          <span className="text-sm text-muted">a</span>
          <input
            type="date"
            name="hasta"
            defaultValue={summary.to}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
          />
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
          >
            Aplicar
          </button>
        </form>

        <p className="w-full text-xs text-muted">
          {longDate(summary.from)} — {longDate(summary.to)}
        </p>
      </section>

      {/* KPIs del rango */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ingresos" value={usd(summary.kpis.income)} tone="income" hint="Sesiones, pedidos y ventas" />
        <Kpi label="Egresos" value={usd(summary.kpis.expense)} tone="expense" hint="Costos del negocio" />
        <Kpi
          label="Balance"
          value={usd(summary.kpis.balance)}
          tone="balance"
          hint={summary.kpis.income > 0 ? `Margen del ${margin}%` : "Sin ingresos en el rango"}
        />
        <Kpi label="Balance histórico" value={usd(summary.kpis.balanceAll)} hint="Desde el primer registro" />
      </div>

      {/* Evolución */}
      <section className="card-soft p-6 sm:p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Ingresos y egresos</h2>
        <p className="mt-1 text-sm text-ink-soft">Pasa el cursor por una barra para ver el detalle del período.</p>
        <div className="mt-7">
          <IncomeExpenseBars buckets={summary.buckets} mode={summary.bucketMode} />
        </div>
      </section>

      {/* Composición */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-6 sm:p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl">De dónde viene el dinero</h2>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            El reparto entre las dos unidades es el dato que decide dónde poner el esfuerzo.
          </p>
          <Donut slices={summary.incomeBySource} empty="Sin ingresos en este rango." />
        </div>

        <div className="card-soft p-6 sm:p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl">En qué se va</h2>
          <p className="mt-1 mb-6 text-sm text-ink-soft">Egresos agrupados por categoría.</p>
          <Donut slices={summary.expensesByCategory} empty="Sin egresos registrados en este rango." />
        </div>
      </section>

      {/* Movimientos */}
      <section>
        <MovementsTable movements={rows} />
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Las sesiones marcadas como realizadas y los pedidos con pago confirmado ya cuentan como ingreso
          automáticamente: no hay que registrarlos aquí. Esta tabla es para los egresos y para las ventas
          que ocurren fuera de la plataforma.
        </p>
      </section>
    </div>
  );
}

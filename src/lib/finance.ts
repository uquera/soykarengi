import { db } from "./db";
import { ORDER_STATUSES } from "./domain";

/**
 * El proceso corre con TZ=America/New_York, así que getFullYear/getMonth/getDate
 * ya devuelven el reloj de Karen y la aritmética de fechas no necesita ajustes.
 */

export const EXPENSE_CATEGORIES = [
  { key: "MATERIALES", label: "Materiales e insumos" },
  { key: "PRODUCCION", label: "Producción y estampado" },
  { key: "ENVIOS", label: "Envíos y empaque" },
  { key: "PLATAFORMAS", label: "Plataformas y software" },
  { key: "MARKETING", label: "Marketing y publicidad" },
  { key: "FORMACION", label: "Formación y supervisión" },
  { key: "IMPUESTOS", label: "Impuestos y comisiones" },
  { key: "OTRO", label: "Otros" },
] as const;

export const INCOME_CATEGORIES = [
  { key: "VENTA_DIRECTA", label: "Venta directa" },
  { key: "SESION_EXTERNA", label: "Sesión fuera de la plataforma" },
  { key: "COLABORACION", label: "Colaboración o taller" },
  { key: "OTRO", label: "Otros" },
] as const;

export const METHODS = [
  { key: "TRANSFERENCIA", label: "Transferencia" },
  { key: "TARJETA", label: "Tarjeta" },
  { key: "EFECTIVO", label: "Efectivo" },
  { key: "OTRO", label: "Otro" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.key, c.label]),
);

export const METHOD_LABEL: Record<string, string> = Object.fromEntries(
  METHODS.map((m) => [m.key, m.label]),
);

/** El origen del ingreso es la unidad de negocio: ese es el dato que importa. */
export const INCOME_SOURCES = [
  { key: "SESIONES", label: "Sesiones · Acompañamiento" },
  { key: "DISENOS", label: "Pedidos · Diseños con Propósito" },
  { key: "OTROS", label: "Ingresos registrados a mano" },
] as const;

export type Bucket = {
  key: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type Slice = { key: string; label: string; amount: number };

export type FinanceSummary = {
  buckets: Bucket[];
  bucketMode: "dia" | "mes";
  expensesByCategory: Slice[];
  incomeBySource: Slice[];
  kpis: {
    income: number;
    expense: number;
    balance: number;
    incomeAll: number;
    expenseAll: number;
    balanceAll: number;
  };
  from: string;
  to: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Una entrada de dinero, venga de donde venga. */
type Entry = { at: Date; amount: number; source: string };

export async function getFinanceSummary(from: Date, to: Date): Promise<FinanceSummary> {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = endOfDay(to);

  const [appointments, orders, movements] = await Promise.all([
    // Una sesión realizada es dinero cobrado.
    db.appointment.findMany({
      where: { status: "COMPLETADA" },
      select: { startsAt: true, service: { select: { price: true } } },
    }),
    // Un pedido con fecha de pago es dinero cobrado.
    db.designRequest.findMany({
      where: { paidAt: { not: null }, status: { in: ORDER_STATUSES } },
      select: { paidAt: true, quoteAmount: true },
    }),
    db.movement.findMany({ select: { kind: true, category: true, amount: true, date: true } }),
  ]);

  const income: Entry[] = [
    ...appointments.map((a) => ({ at: a.startsAt, amount: a.service.price, source: "SESIONES" })),
    ...orders.map((o) => ({ at: o.paidAt as Date, amount: o.quoteAmount ?? 0, source: "DISENOS" })),
    ...movements
      .filter((m) => m.kind === "INGRESO")
      .map((m) => ({ at: m.date, amount: m.amount, source: "OTROS" })),
  ].filter((e) => e.amount > 0);

  const expenses = movements
    .filter((m) => m.kind === "EGRESO")
    .map((m) => ({ at: m.date, amount: m.amount, source: m.category }));

  const inRange = (d: Date) => d >= start && d <= end;
  const incomeRange = income.filter((e) => inRange(e.at));
  const expenseRange = expenses.filter((e) => inRange(e.at));

  // Por día si el rango es corto; por mes si abarca más de cinco semanas.
  const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const bucketMode: "dia" | "mes" = spanDays <= 35 ? "dia" : "mes";
  const buckets: Bucket[] = [];
  const sum = (list: Entry[], keyOf: (d: Date) => string, key: string) =>
    list.filter((e) => keyOf(e.at) === key).reduce((s, e) => s + e.amount, 0);

  if (bucketMode === "dia") {
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const key = isoDay(d);
      const i = sum(incomeRange, isoDay, key);
      const g = sum(expenseRange, isoDay, key);
      buckets.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, income: i, expense: g, balance: i - g });
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) {
      const key = monthKey(cursor);
      const i = sum(incomeRange, monthKey, key);
      const g = sum(expenseRange, monthKey, key);
      buckets.push({ key, label: MONTHS[cursor.getMonth()], income: i, expense: g, balance: i - g });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const expensesByCategory: Slice[] = EXPENSE_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    amount: expenseRange.filter((e) => e.source === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((s) => s.amount > 0);

  const incomeBySource: Slice[] = INCOME_SOURCES.map((s) => ({
    key: s.key,
    label: s.label,
    amount: incomeRange.filter((e) => e.source === s.key).reduce((acc, e) => acc + e.amount, 0),
  })).filter((s) => s.amount > 0);

  const total = (list: Entry[]) => list.reduce((s, e) => s + e.amount, 0);

  return {
    buckets,
    bucketMode,
    expensesByCategory,
    incomeBySource,
    kpis: {
      income: total(incomeRange),
      expense: total(expenseRange),
      balance: total(incomeRange) - total(expenseRange),
      incomeAll: total(income),
      expenseAll: total(expenses),
      balanceAll: total(income) - total(expenses),
    },
    from: isoDay(start),
    to: isoDay(end),
  };
}

/** Resuelve el rango a partir de un preset, para la página y la exportación. */
export function resolveRange(preset?: string, fromStr?: string, toStr?: string) {
  const today = new Date();

  if (preset === "semana") {
    const dow = (today.getDay() + 6) % 7; // 0 = lunes
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: monday, to: sunday, preset: "semana" };
  }

  if (preset === "ano") {
    return {
      from: new Date(today.getFullYear(), 0, 1),
      to: new Date(today.getFullYear(), 11, 31),
      preset: "ano",
    };
  }

  if (preset === "rango" && fromStr && toStr) {
    const f = new Date(`${fromStr}T00:00:00`);
    const t = new Date(`${toStr}T00:00:00`);
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime()) && f <= t) {
      return { from: f, to: t, preset: "rango" };
    }
  }

  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    preset: "mes",
  };
}

/** Dólares con centavos sólo cuando los hay: $110 y $12.50. */
export function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { CATEGORY_LABEL, METHOD_LABEL, resolveRange } from "@/lib/finance";

export const dynamic = "force-dynamic";

/** Excel abre CSV, pero necesita el BOM para no romper los acentos. */
const BOM = "﻿";

function cell(value: string | number) {
  const s = String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new Response("No autorizado", { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const range = resolveRange(
    params.get("preset") ?? undefined,
    params.get("desde") ?? undefined,
    params.get("hasta") ?? undefined,
  );

  const start = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
  const end = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999);

  const [appointments, orders, movements] = await Promise.all([
    db.appointment.findMany({
      where: { status: "COMPLETADA", startsAt: { gte: start, lte: end } },
      include: { service: true, user: true },
      orderBy: { startsAt: "asc" },
    }),
    db.designRequest.findMany({
      where: { paidAt: { gte: start, lte: end }, status: { in: ORDER_STATUSES } },
      include: { user: true, design: true },
      orderBy: { paidAt: "asc" },
    }),
    db.movement.findMany({ where: { date: { gte: start, lte: end } }, orderBy: { date: "asc" } }),
  ]);

  type Row = { date: Date; kind: string; origin: string; concept: string; detail: string; amount: number };

  const rows: Row[] = [
    ...appointments.map((a) => ({
      date: a.startsAt,
      kind: "Ingreso",
      origin: "Sesiones",
      concept: a.service.name,
      detail: `${a.user.name} · ${a.code}`,
      amount: a.service.price,
    })),
    ...orders.map((o) => ({
      date: o.paidAt as Date,
      kind: "Ingreso",
      origin: "Diseños",
      concept: o.design?.name ?? "Diseño a medida",
      detail: `${o.user.name} · ${o.code}`,
      amount: o.quoteAmount ?? 0,
    })),
    ...movements.map((m) => ({
      date: m.date,
      kind: m.kind === "INGRESO" ? "Ingreso" : "Egreso",
      origin: m.kind === "INGRESO" ? "Registrado a mano" : (CATEGORY_LABEL[m.category] ?? m.category),
      concept: m.concept,
      detail: [METHOD_LABEL[m.method] ?? m.method, m.notes].filter(Boolean).join(" · "),
      amount: m.amount,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const income = rows.filter((r) => r.kind === "Ingreso").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.kind === "Egreso").reduce((s, r) => s + r.amount, 0);

  const lines = [
    ["Fecha", "Tipo", "Origen", "Concepto", "Detalle", "Monto USD"].join(";"),
    ...rows.map((r) =>
      [isoDay(r.date), r.kind, r.origin, r.concept, r.detail, r.amount.toFixed(2)].map(cell).join(";"),
    ),
    "",
    ["", "", "", "", "Ingresos", income.toFixed(2)].map(cell).join(";"),
    ["", "", "", "", "Egresos", expense.toFixed(2)].map(cell).join(";"),
    ["", "", "", "", "Balance", (income - expense).toFixed(2)].map(cell).join(";"),
  ];

  const filename = `finanzas-${isoDay(start)}-a-${isoDay(end)}.csv`;

  return new Response(BOM + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateTime, money, shortDate } from "@/lib/format";
import { APPOINTMENT_LABEL, ORDER_STATUSES } from "@/lib/domain";
import { Badge } from "@/components/ui";
import { StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );

  return href ? (
    <Link href={href} className="card-soft p-5 transition-colors hover:border-ink/20">
      {body}
    </Link>
  ) : (
    <div className="card-soft p-5">{body}</div>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    clientes,
    citasPendientes,
    proximasCitas,
    solicitudesNuevas,
    pedidosActivos,
    entregadas,
    mensajes,
    ingresosMes,
    citasMes,
  ] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.appointment.count({ where: { status: "PENDIENTE" } }),
    db.appointment.findMany({
      where: { startsAt: { gte: new Date() }, status: { in: ["PENDIENTE", "CONFIRMADA"] } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { service: true, user: true },
    }),
    db.designRequest.findMany({
      where: { status: { in: ["SOLICITUD", "APROBADA"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true, design: true },
    }),
    db.designRequest.count({ where: { status: { in: ORDER_STATUSES, notIn: ["ENTREGADA"] } } }),
    db.designRequest.count({ where: { status: "ENTREGADA" } }),
    db.contactMessage.count({ where: { handled: false } }),
    db.designRequest.aggregate({
      _sum: { quoteAmount: true },
      where: { paidAt: { gte: startOfMonth } },
    }),
    db.appointment.count({ where: { startsAt: { gte: startOfMonth }, status: { not: "CANCELADA" } } }),
  ]);

  return (
    <div className="space-y-9">
      <header>
        <p className="eyebrow text-muted">Panel administrativo</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-ink-soft">Las dos unidades de negocio en una sola vista.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clientes" value={clientes} href="/admin/clientes" />
        <Stat label="Citas por confirmar" value={citasPendientes} href="/admin/agenda" />
        <Stat label="Pedidos activos" value={pedidosActivos} href="/admin/pedidos" />
        <Stat label="Mensajes sin leer" value={mensajes} href="/admin/mensajes" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ingresos del mes" value={money(ingresosMes._sum.quoteAmount ?? 0)} hint="Pedidos pagados" />
        <Stat label="Sesiones del mes" value={citasMes} hint="Citas no canceladas" />
        <Stat label="Proyectos entregados" value={entregadas} hint="Histórico" />
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-orchid-deep">Próximas citas</p>
            <Link href="/admin/agenda" className="text-[0.8125rem] text-muted hover:text-ink">
              Ver agenda →
            </Link>
          </div>

          {proximasCitas.length === 0 ? (
            <p className="mt-5 text-sm text-muted">No hay citas próximas.</p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {proximasCitas.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.user.name}</p>
                    <p className="mt-0.5 truncate text-[0.8125rem] text-muted">
                      {a.service.name} · {dateTime(a.startsAt)}
                    </p>
                  </div>
                  <Badge tone={a.status === "CONFIRMADA" ? "orchid" : "amber"}>
                    {APPOINTMENT_LABEL[a.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-rose-deep">Solicitudes que te esperan</p>
            <Link href="/admin/solicitudes" className="text-[0.8125rem] text-muted hover:text-ink">
              Ver todas →
            </Link>
          </div>

          {solicitudesNuevas.length === 0 ? (
            <p className="mt-5 text-sm text-muted">No hay solicitudes pendientes de tu acción.</p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {solicitudesNuevas.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.user.name}</p>
                    <p className="mt-0.5 truncate text-[0.8125rem] text-muted">
                      {r.design?.name ?? r.purpose} · {shortDate(r.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

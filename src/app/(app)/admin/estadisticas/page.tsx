import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { REQUEST_LABEL, SEGMENT_LABEL, segmentOf, ORDER_STATUSES } from "@/lib/domain";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Estadísticas" };

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-semibold">
          {value} <span className="text-xs font-normal text-muted">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-shell">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

export default async function AdminEstadisticasPage() {
  await requireAdmin();

  const [users, appointments, requests, services, designs] = await Promise.all([
    db.user.findMany({
      where: { role: "CLIENT" },
      include: { _count: { select: { appointments: true, designRequests: true } } },
    }),
    db.appointment.findMany({ include: { service: true } }),
    db.designRequest.findMany({ include: { design: { include: { category: true } } } }),
    db.service.findMany({ include: { _count: { select: { appointments: true } } } }),
    db.design.findMany({ include: { _count: { select: { requests: true } } } }),
  ]);

  const segments = users.map((u) => segmentOf(u._count.appointments, u._count.designRequests));
  const tally = {
    AMBAS: segments.filter((s) => s === "AMBAS").length,
    SERVICIOS: segments.filter((s) => s === "SERVICIOS").length,
    DISENOS: segments.filter((s) => s === "DISENOS").length,
    SIN_ACTIVIDAD: segments.filter((s) => s === "SIN_ACTIVIDAD").length,
  };

  const facturado = requests
    .filter((r) => ORDER_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + (r.quoteAmount ?? 0), 0);

  const ingresosServicios = appointments
    .filter((a) => a.status === "COMPLETADA")
    .reduce((sum, a) => sum + a.service.price, 0);

  const statusTally = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const topServices = [...services].sort((a, b) => b._count.appointments - a._count.appointments).slice(0, 5);
  const topDesigns = [...designs].sort((a, b) => b._count.requests - a._count.requests).slice(0, 5);

  const conversion =
    requests.length > 0
      ? Math.round((requests.filter((r) => ORDER_STATUSES.includes(r.status)).length / requests.length) * 100)
      : 0;

  return (
    <div className="space-y-9">
      <header>
        <p className="eyebrow text-muted">Transversal</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Estadísticas</h1>
        <p className="mt-2 text-ink-soft">
          El cruce entre unidades es el dato comercial más importante de la plataforma.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Clientes totales", users.length],
          ["Ingresos diseños", money(facturado)],
          ["Ingresos servicios", money(ingresosServicios)],
          ["Solicitudes que se convierten", `${conversion}%`],
        ].map(([label, value]) => (
          <div key={label as string} className="card-soft p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="card-soft p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Segmentación de clientes</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Los clientes que usan ambas unidades son la oportunidad comercial: ya confían en la marca completa.
        </p>

        <div className="mt-7 space-y-5">
          <Bar label={SEGMENT_LABEL.AMBAS} value={tally.AMBAS} total={users.length} tone="#C0972F" />
          <Bar label={SEGMENT_LABEL.SERVICIOS} value={tally.SERVICIOS} total={users.length} tone="#6E8B74" />
          <Bar label={SEGMENT_LABEL.DISENOS} value={tally.DISENOS} total={users.length} tone="#BC7A52" />
          <Bar
            label={SEGMENT_LABEL.SIN_ACTIVIDAD}
            value={tally.SIN_ACTIVIDAD}
            total={users.length}
            tone="#C9BEB1"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Servicios más pedidos</h2>
          {topServices.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin datos todavía.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {topServices.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink-soft">{s.name}</span>
                  <span className="font-semibold">{s._count.appointments}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Diseños más solicitados</h2>
          {topDesigns.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin datos todavía.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {topDesigns.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink-soft">{d.name}</span>
                  <span className="font-semibold">{d._count.requests}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card-soft p-7">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Solicitudes por etapa</h2>
        {requests.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Sin solicitudes todavía.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {Object.entries(statusTally)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <Bar
                  key={status}
                  label={REQUEST_LABEL[status] ?? status}
                  value={count}
                  total={requests.length}
                  tone="#BC7A52"
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

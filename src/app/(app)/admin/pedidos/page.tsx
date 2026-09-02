import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ORDER_STATUSES, REQUEST_FLOW, REQUEST_LABEL } from "@/lib/domain";
import { advanceRequestAction } from "@/lib/actions/designs";
import { EmptyState, inputClass } from "@/components/ui";
import { StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pedidos" };

export default async function AdminPedidosPage() {
  await requireAdmin();

  const orders = await db.designRequest.findMany({
    where: { status: { in: ORDER_STATUSES } },
    orderBy: { updatedAt: "desc" },
    include: { user: true, design: true },
  });

  const facturado = orders.reduce((sum, o) => sum + (o.quoteAmount ?? 0), 0);
  const enCurso = orders.filter((o) => o.status !== "ENTREGADA").length;

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow text-clay-deep">Unidad Diseños</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Pedidos</h1>
        <p className="mt-2 text-ink-soft">Solicitudes que ya pasaron por caja.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-soft p-5">
          <p className="text-sm text-muted">Pedidos totales</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{orders.length}</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-sm text-muted">En producción</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{enCurso}</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-sm text-muted">Facturado</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{money(facturado)}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Todavía no hay pedidos"
          lead="Cuando una cotización se apruebe y marques el pago, el proyecto aparecerá aquí."
          action={
            <Link href="/admin/solicitudes" className="mt-2 text-sm font-semibold underline underline-offset-2">
              Ir a solicitudes
            </Link>
          }
        />
      ) : (
        <div className="card-soft divide-y divide-line">
          {orders.map((o) => (
            <div key={o.id} className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={o.status} />
                  <span className="text-xs text-muted">{o.code}</span>
                </div>
                <p className="mt-2 font-semibold">{o.design?.name ?? "Diseño a medida"}</p>
                <p className="mt-0.5 text-[0.8125rem] text-muted">
                  {o.user.name} · {o.quantity} {o.quantity === 1 ? "pieza" : "piezas"} · {o.format}
                  {o.paidAt ? ` · pagado ${shortDate(o.paidAt)}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="font-[family-name:var(--font-display)] text-xl">{money(o.quoteAmount)}</span>
                <form action={advanceRequestAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} className={`${inputClass} w-auto py-2`}>
                    {REQUEST_FLOW.filter((s) => ORDER_STATUSES.includes(s)).map((s) => (
                      <option key={s} value={s}>
                        {REQUEST_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                  >
                    Actualizar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

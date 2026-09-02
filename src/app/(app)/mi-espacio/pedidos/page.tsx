import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { designName } from "@/lib/content";
import { ButtonLink, EmptyState } from "@/components/ui";
import { RequestTimeline, StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function MisPedidosPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  // Un pedido es una solicitud que ya pasó por caja.
  const orders = await db.designRequest.findMany({
    where: { userId: user.id, status: { in: ORDER_STATUSES } },
    orderBy: { updatedAt: "desc" },
    include: { design: true, deliverables: true },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-clay-deep">{t.home.unit02}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          {t.space.orders.title}
        </h1>
        <p className="mt-2 text-ink-soft">{t.space.orders.lead}</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title={t.space.orders.emptyTitle}
          lead={t.space.orders.emptyLead}
          action={
            <ButtonLink href="/mi-espacio/disenos" tone="clay" className="mt-2">
              {t.space.orders.emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="card-soft p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <StatusPill status={o.status} labels={t.status.request} />
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">
                    {designName(o.design, locale, t.space.orders.custom)}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {o.recipient} · {o.quantity}{" "}
                    {o.quantity === 1 ? t.space.orders.piece : t.space.orders.pieces} ·{" "}
                    {t.vocab.formats[o.format] ?? o.format}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {o.code}
                    {o.paidAt ? ` · ${t.space.orders.paidOn} ${shortDate(o.paidAt, locale)}` : ""}
                    {o.deliveredAt
                      ? ` · ${t.space.orders.deliveredOn} ${shortDate(o.deliveredAt, locale)}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">{t.space.orders.total}</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl">
                    {money(o.quoteAmount, locale)}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <RequestTimeline
                  status={o.status}
                  labels={t.status.request}
                  cancelledText={t.status.cancelled}
                />
              </div>

              {o.deliverables.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {o.deliverables.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-sage/30 bg-sage-soft px-4 py-2 text-[0.8125rem] font-semibold text-sage-deep"
                      >
                        ↓ {d.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

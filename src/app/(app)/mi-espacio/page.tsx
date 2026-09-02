import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { designName, serviceView } from "@/lib/content";
import { ButtonLink, EmptyState } from "@/components/ui";
import { StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mi espacio" };

export default async function MiEspacioPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  const [nextAppointment, openRequests, deliverables, counts] = await Promise.all([
    db.appointment.findFirst({
      where: { userId: user.id, status: { in: ["PENDIENTE", "CONFIRMADA"] }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { service: true },
    }),
    db.designRequest.findMany({
      where: { userId: user.id, NOT: { status: { in: ["ENTREGADA", "CANCELADA"] } } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { design: true },
    }),
    db.deliverable.count({ where: { request: { userId: user.id } } }),
    Promise.all([
      db.appointment.count({ where: { userId: user.id } }),
      db.designRequest.count({ where: { userId: user.id } }),
      db.designRequest.count({ where: { userId: user.id, status: { in: ORDER_STATUSES } } }),
    ]),
  ]);

  const [totalCitas, totalDisenos, totalPedidos] = counts;
  const pendingQuote = openRequests.find((r) => r.status === "COTIZADA");
  const nextService = nextAppointment ? serviceView(nextAppointment.service, locale) : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-rose">
          {t.space.hi}, {user.name.split(" ")[0]}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{t.space.title}</h1>
        <p className="mt-2 text-ink-soft">{t.space.lead}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [t.space.statAppointments, totalCitas, "/mi-espacio/citas"],
          [t.space.statRequests, totalDisenos, "/mi-espacio/disenos"],
          [t.space.statOrders, totalPedidos, "/mi-espacio/pedidos"],
        ].map(([label, value, href]) => (
          <Link key={href as string} href={href as string} className="card-soft p-5 hover:border-ink/20">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{value}</p>
          </Link>
        ))}
      </div>

      {pendingQuote ? (
        <div className="rounded-2xl border border-amber/40 bg-amber/10 p-6">
          <p className="eyebrow text-amber-ink">{t.space.quoteWaiting}</p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl">
            {designName(pendingQuote.design, locale, t.vocab.purposes[pendingQuote.purpose] ?? pendingQuote.purpose)}{" "}
            · {money(pendingQuote.quoteAmount, locale)}
          </p>
          {pendingQuote.quoteNotes ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{pendingQuote.quoteNotes}</p>
          ) : null}
          <ButtonLink href="/mi-espacio/disenos" tone="ink" className="mt-5">
            {t.space.reviewQuote}
          </ButtonLink>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-orchid-deep">{t.space.nextAppointment}</p>
            <Link href="/mi-espacio/citas" className="text-[0.8125rem] text-muted hover:text-ink">
              {t.space.seeAll}
            </Link>
          </div>

          {nextAppointment && nextService ? (
            <div className="mt-5">
              <p className="font-[family-name:var(--font-display)] text-2xl leading-snug">
                {nextService.name}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{dateTime(nextAppointment.startsAt, locale)}</p>
              <p className="mt-1 text-sm text-muted">
                {t.vocab.modalities[nextAppointment.modality] ?? nextAppointment.modality} ·{" "}
                {t.status.appointment[nextAppointment.status]}
              </p>
              <p className="mt-4 text-xs text-muted">
                {t.space.code} {nextAppointment.code}
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-ink-soft">{t.space.noAppointments}</p>
              <ButtonLink href="/acompanamiento/agenda" tone="orchid" className="mt-5">
                {t.space.bookOne}
              </ButtonLink>
            </div>
          )}
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-rose-deep">{t.space.openDesigns}</p>
            <Link href="/mi-espacio/disenos" className="text-[0.8125rem] text-muted hover:text-ink">
              {t.space.seeAll}
            </Link>
          </div>

          {openRequests.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {openRequests.map((r) => (
                <li key={r.id} className="rounded-xl border border-line px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {designName(r.design, locale, t.vocab.purposes[r.purpose] ?? r.purpose)}
                      </p>
                      <p className="mt-0.5 truncate text-[0.8125rem] text-muted">{r.recipient}</p>
                    </div>
                    <StatusPill status={r.status} labels={t.status.request} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-ink-soft">{t.space.noOpenDesigns}</p>
              <ButtonLink href="/configurador" tone="rose" className="mt-5">
                {t.space.createDesign}
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      {deliverables > 0 ? (
        <Link
          href="/mi-espacio/archivos"
          className="card-soft flex items-center justify-between gap-4 p-6 hover:border-ink/20"
        >
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl">
              {t.space.filesReady} {deliverables}{" "}
              {deliverables === 1 ? t.space.fileSingular : t.space.filePlural}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{t.space.filesNote}</p>
          </div>
          <span className="text-2xl">→</span>
        </Link>
      ) : null}

      {totalCitas === 0 && totalDisenos === 0 ? (
        <EmptyState
          title={t.space.emptyTitle}
          lead={t.space.emptyLead}
          action={
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/acompanamiento/agenda" tone="orchid">
                {t.space.bookOne}
              </ButtonLink>
              <ButtonLink href="/configurador" tone="rose">
                {t.space.createDesign}
              </ButtonLink>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

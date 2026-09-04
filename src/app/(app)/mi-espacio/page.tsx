import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { ORDER_STATUSES, REQUEST_COLOR } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { designName, serviceView } from "@/lib/content";
import { ButtonLink, EmptyState } from "@/components/ui";
import { StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mi espacio" };

/** Color del estado de una cita, en la misma clave que el tracker de pedidos. */
const APPOINTMENT_COLOR: Record<string, string> = {
  PENDIENTE: "#D8A129",
  CONFIRMADA: "#4C9A8A",
  COMPLETADA: "#494C31",
  CANCELADA: "#A0938A",
};

function StateLine({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export default async function MiEspacioPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  const [nextAppointment, lastAppointment, openRequests, deliverables, counts] = await Promise.all([
    db.appointment.findFirst({
      where: { userId: user.id, status: { in: ["PENDIENTE", "CONFIRMADA"] }, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { service: true },
    }),
    db.appointment.findFirst({
      where: { userId: user.id },
      orderBy: { startsAt: "desc" },
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

  // "Mi proceso" mira el acompañamiento; "Mi diseño" mira la unidad de diseños.
  const processAppointment = nextAppointment ?? lastAppointment;
  const currentDesign = openRequests[0];

  const quickAccess = [
    { href: "/mi-espacio/citas", label: t.space.nav.citas, count: totalCitas },
    { href: "/mi-espacio/disenos", label: t.space.nav.disenos, count: totalDisenos },
    { href: "/mi-espacio/pedidos", label: t.space.nav.pedidos, count: totalPedidos },
    { href: "/mi-espacio/archivos", label: t.space.nav.archivos, count: deliverables },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          {t.space.hi}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-ink-soft">{t.space.lead}</p>
      </header>

      {/* PRÓXIMAMENTE — lo primero que alguien quiere saber al entrar */}
      <section className="card-soft overflow-hidden">
        <div className="border-b border-line bg-orchid-soft px-6 py-4">
          <p className="eyebrow text-orchid-deep">{t.space.upcoming}</p>
        </div>

        {nextAppointment && nextService ? (
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-display)] text-2xl leading-snug">
                {nextService.name}
              </p>
              <p className="mt-2 text-ink-soft capitalize">{dateTime(nextAppointment.startsAt, locale)}</p>
              <p className="mt-1 text-sm text-muted">
                {t.vocab.modalities[nextAppointment.modality] ?? nextAppointment.modality} ·{" "}
                {t.space.code} {nextAppointment.code}
              </p>
            </div>
            <Link
              href="/mi-espacio/citas"
              className="rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
            >
              {t.space.seeAll}
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
            <p className="text-sm text-ink-soft">{t.space.noAppointments}</p>
            <ButtonLink href="/acompanamiento/agenda" tone="orchid" className="px-5 py-2.5">
              {t.space.bookOne}
            </ButtonLink>
          </div>
        )}
      </section>

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

      {/* MI PROCESO · MI DISEÑO — una unidad de negocio en cada tarjeta */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Link href="/mi-espacio/citas" className="card-soft p-6 transition-colors hover:border-orchid/50">
          <p className="eyebrow text-orchid-deep">{t.space.myProcess}</p>
          {processAppointment ? (
            <>
              <p className="mt-4 font-[family-name:var(--font-display)] text-xl leading-snug">
                {serviceView(processAppointment.service, locale).name}
              </p>
              <div className="mt-3">
                <StateLine
                  color={APPOINTMENT_COLOR[processAppointment.status] ?? "#857060"}
                  label={t.status.appointment[processAppointment.status] ?? processAppointment.status}
                />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{t.space.noProcess}</p>
          )}
        </Link>

        <Link href="/mi-espacio/disenos" className="card-soft p-6 transition-colors hover:border-moss/60">
          <p className="eyebrow text-moss-deep">{t.space.myDesign}</p>
          {currentDesign ? (
            <>
              <p className="mt-4 font-[family-name:var(--font-display)] text-xl leading-snug">
                {designName(
                  currentDesign.design,
                  locale,
                  t.vocab.purposes[currentDesign.purpose] ?? currentDesign.purpose,
                )}
              </p>
              <div className="mt-3">
                <StateLine
                  color={REQUEST_COLOR[currentDesign.status] ?? "#857060"}
                  label={t.status.request[currentDesign.status] ?? currentDesign.status}
                />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{t.space.noDesign}</p>
          )}
        </Link>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section>
        <p className="eyebrow mb-4 text-muted">{t.space.quickAccess}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccess.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card-soft flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:border-ink/25"
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-muted">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {openRequests.length > 1 ? (
        <section className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-moss-deep">{t.space.openDesigns}</p>
            <Link href="/mi-espacio/disenos" className="text-[0.8125rem] text-muted hover:text-ink">
              {t.space.seeAll}
            </Link>
          </div>
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
        </section>
      ) : null}

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
              <ButtonLink href="/configurador" tone="moss">
                {t.space.createDesign}
              </ButtonLink>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

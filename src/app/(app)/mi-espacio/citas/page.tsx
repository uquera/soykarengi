import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, duration, money } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { cancelAppointmentAction } from "@/lib/actions/booking";
import { ButtonLink, EmptyState, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis citas" };

export default async function MisCitasPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string }>;
}) {
  const [user, locale, t, { nueva }] = await Promise.all([
    requireUser(),
    getLocale(),
    getDict(),
    searchParams,
  ]);

  const appointments = await db.appointment.findMany({
    where: { userId: user.id },
    orderBy: { startsAt: "desc" },
    include: { service: true },
  });

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.startsAt) >= now && ["PENDIENTE", "CONFIRMADA"].includes(a.status),
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sage-deep">{t.home.unit01}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            {t.space.appointments.title}
          </h1>
        </div>
        <ButtonLink href="/acompanamiento/agenda" tone="sage">
          {t.space.appointments.bookAnother}
        </ButtonLink>
      </header>

      {nueva ? (
        <div className="rounded-2xl border border-sage/40 bg-sage-soft px-6 py-5">
          <p className="font-semibold text-sage-deep">{t.space.appointments.created}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {t.space.code} {nueva}. {t.space.appointments.createdLead}
          </p>
        </div>
      ) : null}

      {appointments.length === 0 ? (
        <EmptyState
          title={t.space.appointments.emptyTitle}
          lead={t.space.appointments.emptyLead}
          action={
            <ButtonLink href="/acompanamiento/agenda" tone="sage" className="mt-2">
              {t.space.appointments.emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 ? (
            <section>
              <h2 className="eyebrow mb-4 text-muted">{t.space.appointments.upcoming}</h2>
              <div className="space-y-3">
                {upcoming.map((a) => {
                  const service = serviceView(a.service, locale);
                  return (
                    <article key={a.id} className="card-soft p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={a.status === "CONFIRMADA" ? "sage" : "gold"}>
                              {t.status.appointment[a.status]}
                            </Badge>
                            <Badge tone="muted">{t.vocab.modalities[a.modality] ?? a.modality}</Badge>
                          </div>
                          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">
                            {service.name}
                          </p>
                          <p className="mt-2 text-sm text-ink-soft">{dateTime(a.startsAt, locale)}</p>
                          <p className="mt-1 text-sm text-muted">
                            {duration(service.durationMin, locale)} · {money(service.price, locale)} ·{" "}
                            {t.space.code} {a.code}
                          </p>
                        </div>

                        <form action={cancelAppointmentAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-clay/50 hover:text-clay-deep"
                          >
                            {t.space.appointments.cancel}
                          </button>
                        </form>
                      </div>

                      <div className="mt-5 rounded-xl bg-shell/70 px-4 py-3">
                        <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                          {t.space.appointments.shared}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{a.reason}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section>
              <h2 className="eyebrow mb-4 text-muted">{t.space.appointments.history}</h2>
              <div className="card-soft divide-y divide-line">
                {past.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{serviceView(a.service, locale).name}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-muted">
                        {dateTime(a.startsAt, locale)} · {a.code}
                      </p>
                    </div>
                    <Badge tone={a.status === "CANCELADA" ? "muted" : "neutral"}>
                      {t.status.appointment[a.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

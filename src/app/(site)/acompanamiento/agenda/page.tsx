import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { upcomingDays, businessHoursLabel } from "@/lib/availability";
import { timezoneLabel } from "@/lib/timezone";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { Eyebrow, ButtonLink } from "@/components/ui";
import { NeedFinder } from "@/components/need-finder";
import { money, duration } from "@/lib/format";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.agenda.title, description: t.agenda.lead };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const [session, locale, t, servicesRaw] = await Promise.all([
    getSession(),
    getLocale(),
    getDict(),
    db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  const services = servicesRaw.map((s) => serviceView(s, locale));
  const preselected = servicio ? (services.find((s) => s.slug === servicio)?.id ?? "") : "";

  // `specialty` va sin traducir a propósito: es la clave con la que cruza NEEDS.
  const finderServices = servicesRaw.map((row) => {
    const s = serviceView(row, locale);
    return {
      slug: s.slug,
      name: s.name,
      summary: s.summary,
      specialty: row.specialty,
      price: s.priceLabel,
      duration: duration(s.durationMin, locale),
    };
  });

  return (
    <div className="shell grid gap-14 py-16 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="min-w-0">
        <Eyebrow className="text-orchid-deep">{t.home.servicesEyebrow}</Eyebrow>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[1.1] sm:text-5xl">
          {t.agenda.title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{t.agenda.lead}</p>

        {/* «Antes de reservar»: si ya sabes qué quieres, sáltalo y baja al paso 1. */}
        {!servicio ? (
          <div className="mt-10">
            <NeedFinder
              services={finderServices}
              copy={{
                eyebrow: t.finder.eyebrow,
                title: t.finder.title,
                lead: t.finder.lead,
                options: t.finder.options,
                resultEyebrow: t.finder.resultEyebrow,
                resultLead: t.finder.resultLead,
                seeSheet: t.finder.seeSheet,
                book: t.finder.book,
                again: t.finder.again,
                note: t.finder.note,
              }}
            />
          </div>
        ) : null}

        <div className="mt-10">
          {session ? (
            <BookingForm
              services={services.map((s) => ({
                id: s.id,
                slug: s.slug,
                name: s.name,
                modality: s.modality,
                modalityLabel: s.modalityLabel,
                durationMin: s.durationMin,
                price: s.price,
                accentEmoji: s.accentEmoji,
              }))}
              days={upcomingDays(14, locale)}
              initialServiceId={preselected}
              locale={locale}
              copy={{
                step: t.agenda.step,
                stepService: t.agenda.stepService,
                stepWhen: t.agenda.stepWhen,
                stepBefore: t.agenda.stepBefore,
                beforeLead: t.agenda.beforeLead,
                modality: t.agenda.modality,
                modalityOptions: [
                  { value: "Online", label: locale === "en" ? "Online" : "Online" },
                  { value: "Presencial", label: locale === "en" ? "In person" : "Presencial" },
                ],
                firstTimeQ: t.agenda.firstTimeQ,
                firstTimeYes: t.agenda.firstTimeYes,
                firstTimeNo: t.agenda.firstTimeNo,
                reasonLabel: t.agenda.reasonLabel,
                reasonHint: t.agenda.reasonHint,
                reasonPlaceholder: t.agenda.reasonPlaceholder,
                loadingSlots: t.agenda.loadingSlots,
                noSlots: t.agenda.noSlots,
                summaryService: t.agenda.summaryService,
                summaryWhen: t.agenda.summaryWhen,
                summaryPending: t.agenda.summaryPending,
                summaryValue: t.agenda.summaryValue,
                confirm: t.agenda.confirm,
                sending: t.agenda.sending,
                confirmNote: t.agenda.confirmNote,
              }}
            />
          ) : (
            <div className="card-soft px-8 py-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl">{t.agenda.gateTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                {t.agenda.gateLead}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/registro?next=/acompanamiento/agenda" tone="orchid">
                  {t.agenda.gateCreate}
                </ButtonLink>
                <ButtonLink href="/ingresar?next=/acompanamiento/agenda" tone="ghost">
                  {t.agenda.gateHave}
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="card-soft p-6">
          <p className="eyebrow text-muted">{t.agenda.hoursTitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{businessHoursLabel(locale)}</p>
          <p className="mt-1 text-xs text-muted">{timezoneLabel(locale)}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.agenda.hoursNote}</p>
        </div>

        <div className="card-soft p-6">
          <p className="eyebrow text-muted">{t.agenda.howTitle}</p>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            {t.agenda.howSteps.map((step, i) => (
              <li key={step}>
                <span className="font-semibold text-ink">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-line bg-shell/70 p-6 text-sm leading-relaxed text-ink-soft">
          {t.agenda.needOther}{" "}
          <Link href="/contacto" className="font-semibold text-ink underline underline-offset-2">
            {t.agenda.writeMe}
          </Link>{" "}
          {t.agenda.andWeSee}
        </div>
      </aside>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { duration } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { ButtonLink, Eyebrow, SectionHeading, Badge } from "@/components/ui";
import { KarenPortrait } from "@/components/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: `${t.unit1.unitName} · ${t.unit1.claim}`,
    description: t.unit1.claimLead,
    alternates: { canonical: "/acompanamiento" },
  };
}

export default async function AcompanamientoPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);
  const services = (await db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } })).map(
    (s) => serviceView(s, locale),
  );

  return (
    <>
      {/* El claim primero: "Entrena tu mente y renace" es la promesa, la
          biografía viene después para sostenerla. */}
      <section className="border-b border-line bg-orchid-soft/60">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rise">
            <Eyebrow className="text-orchid-deep">{t.unit1.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
              {t.unit1.claim}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t.unit1.claimLead}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/acompanamiento/agenda" tone="orchid">
                {t.unit1.bookSession}
              </ButtonLink>
              <ButtonLink href="/acompanamiento/servicios" tone="ghost">
                {t.unit1.seeServices}
              </ButtonLink>
            </div>
          </div>

          <div className="rise" style={{ animationDelay: "100ms" }}>
            <div className="card-soft p-8">
              <p className="eyebrow text-muted">{t.unit1.howIWork}</p>
              <ul className="mt-6 space-y-5">
                {t.unit1.pillars.map((p) => (
                  <li key={p.title} className="border-l-2 border-orchid/40 pl-5">
                    <p className="font-[family-name:var(--font-display)] text-lg text-orchid-deep">{p.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-shell px-5 py-4 text-[0.8125rem] leading-relaxed text-ink-soft">
                {t.unit1.formNote}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Los cuatro formatos */}
      <section className="shell py-20">
        <SectionHeading
          eyebrow={t.footer.servicios}
          title={t.unit1.servicesTitle}
          lead={t.unit1.servicesLead}
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/acompanamiento/servicios/${s.slug}`}
              className="card-soft flex flex-col p-7 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-2xl">{s.accentEmoji}</span>
                <Badge tone="orchid">{s.specialty}</Badge>
              </div>
              <p className="mt-5 font-[family-name:var(--font-display)] text-2xl leading-snug">{s.name}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{s.summary}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[0.8125rem]">
                <span className="text-muted">
                  {duration(s.durationMin, locale)} · {s.modalityLabel}
                </span>
                <span className="font-semibold">{s.priceLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Llamado a la acción, con los tres caminos que pidió Karen */}
      <section className="shell pb-20">
        <div className="grain relative overflow-hidden rounded-3xl bg-orchid-deep px-8 py-14 text-cream sm:px-14">
          <div className="relative max-w-3xl">
            <p className="font-[family-name:var(--font-display)] text-3xl leading-tight text-balance sm:text-4xl">
              {t.unit1.startTitle}
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-cream/75">{t.unit1.startLead}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/acompanamiento/agenda?servicio=terapia-psicologica"
                className="inline-flex rounded-full bg-cream px-6 py-3 text-sm font-semibold text-orchid-deep transition-colors hover:bg-white"
              >
                {t.unit1.startTherapy}
              </Link>
              <Link
                href="/acompanamiento/agenda?servicio=life-coaching"
                className="inline-flex rounded-full border border-cream/35 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
              >
                {t.unit1.startCoaching}
              </Link>
              <Link
                href="/acompanamiento/servicios/mentorias"
                className="inline-flex rounded-full border border-cream/35 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
              >
                {t.unit1.startMentoring}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOY KAREN RAMOS */}
      <section className="border-t border-line bg-shell/50 py-20">
        <div className="shell grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <div className="flex justify-center lg:justify-start">
              <KarenPortrait size={230} />
            </div>

            <Link
              href="/crp"
              className="card-soft mt-8 flex items-center gap-4 p-5 transition-colors hover:border-orchid/50"
            >
              <img
                src="/crp-buho.png"
                alt=""
                aria-hidden="true"
                width={52}
                height={52}
                className="shrink-0"
                style={{ width: 52, height: 52 }}
              />
              <span>
                <span className="block text-[0.8125rem] font-semibold text-ink">{t.crp.creditTitle}</span>
                <span className="mt-0.5 block text-[0.8125rem] text-muted">{t.crp.title} →</span>
              </span>
            </Link>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] text-balance sm:text-4xl">
              {t.unit1.aboutTitle}
            </h2>
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
              {t.unit1.aboutBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow={t.footer.especialidades}
            title={t.unit1.specialtiesTitle}
            lead={t.unit1.specialtiesLead}
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.unit1.specialtyList.map((item) => (
              <li key={item} className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-soft">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

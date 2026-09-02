import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money, duration } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { ButtonLink, Eyebrow, SectionHeading, Badge } from "@/components/ui";
import { KarenPortrait } from "@/components/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.unit1.aboutTitle, description: t.unit1.servicesLead };
}

export default async function AcompanamientoPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);
  const services = (await db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } })).map(
    (s) => serviceView(s, locale),
  );

  return (
    <>
      <section className="border-b border-line bg-orchid-soft/40">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rise">
            <div className="mb-8 lg:hidden">
              <KarenPortrait size={160} />
            </div>
            <Eyebrow className="text-orchid-deep">{t.unit1.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-balance sm:text-5xl">
              {t.unit1.aboutTitle}
            </h1>
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
              {t.unit1.aboutBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

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
            <div className="mb-8 hidden lg:block">
              <img
                src="/sparkwell-marca.jpg"
                alt="Karen Ramos · SparkWell by Karengi: psicóloga, bienestar y propósito"
                className="w-full rounded-3xl border border-line object-cover shadow-sm"
              />
            </div>

            <div className="card-soft p-8">
            <p className="eyebrow text-muted">{t.unit1.howIWork}</p>
            <ul className="mt-6 space-y-6">
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
                <span className="font-semibold">{money(s.price, locale)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-shell/60 py-20">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
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

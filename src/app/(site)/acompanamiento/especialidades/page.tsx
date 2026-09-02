import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { ButtonLink, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.specialties.title, description: t.specialties.lead };
}

export default async function EspecialidadesPage() {
  const t = await getDict();

  return (
    <div className="shell py-16">
      <SectionHeading
        eyebrow={t.home.servicesEyebrow}
        title={t.specialties.title}
        lead={t.specialties.lead}
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {t.specialties.areas.map((area) => (
          <article key={area.title} className="card-soft p-7">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">{area.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{area.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {area.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-orchid/25 bg-orchid-soft/70 px-3 py-1.5 text-[0.8125rem] text-orchid-deep"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-ink px-8 py-12 text-center text-cream sm:px-14">
        <p className="font-[family-name:var(--font-display)] text-3xl text-balance">
          {t.specialties.ctaTitle}
        </p>
        <p className="mx-auto mt-3 max-w-lg text-cream/70">{t.specialties.ctaLead}</p>
        <ButtonLink href="/acompanamiento/agenda" tone="orchid" className="mt-8">
          {t.specialties.cta}
        </ButtonLink>
      </div>
    </div>
  );
}

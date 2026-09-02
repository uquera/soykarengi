import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money, duration } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { Badge, ButtonLink, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.services.title, description: t.services.lead };
}

export default async function ServiciosPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);
  const services = (await db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } })).map(
    (s) => serviceView(s, locale),
  );

  return (
    <div className="shell py-16">
      <SectionHeading eyebrow={t.home.servicesEyebrow} title={t.services.title} lead={t.services.lead} />

      <div className="mt-12 space-y-4">
        {services.map((s) => (
          <article key={s.id} className="card-soft grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xl">{s.accentEmoji}</span>
                <Badge tone="orchid">{s.specialty}</Badge>
                <Badge tone="muted">{s.modalityLabel}</Badge>
                <Badge tone="muted">{duration(s.durationMin, locale)}</Badge>
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl leading-snug">
                <Link href={`/acompanamiento/servicios/${s.slug}`} className="hover:text-orchid-deep">
                  {s.name}
                </Link>
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{s.summary}</p>
            </div>

            <div className="flex items-center gap-5 sm:flex-col sm:items-end">
              <p className="font-[family-name:var(--font-display)] text-2xl">{money(s.price, locale)}</p>
              <ButtonLink href={`/acompanamiento/servicios/${s.slug}`} tone="orchid" className="px-5 py-2.5">
                {t.services.seeSheet}
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-line bg-shell/70 px-8 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl">{t.services.unsureTitle}</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">{t.services.unsureLead}</p>
        <ButtonLink href="/contacto" tone="ghost" className="mt-6">
          {t.services.unsureCta}
        </ButtonLink>
      </div>
    </div>
  );
}

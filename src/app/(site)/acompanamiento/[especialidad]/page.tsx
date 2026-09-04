import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money, duration } from "@/lib/format";
import { SPECIALTY_PAGES, specialtyPageOf } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { Badge, ButtonLink, Eyebrow } from "@/components/ui";
import { KarenPortrait } from "@/components/brand";

export const dynamic = "force-dynamic";

/**
 * Una página por especialidad, con su URL y su contenido. Nacen del punto de
 * SEO del documento: "psicóloga online en español" o "mentoría para mujeres"
 * son búsquedas concretas, y cada una necesita una página que las responda.
 */
const KEYWORDS: Record<string, string[]> = {
  psicologia: ["psicóloga online en español", "psicología online", "terapia en español", "psicóloga latina"],
  "life-coaching": ["life coach en español", "life coaching online", "coaching de vida"],
  mentoria: ["mentoría para mujeres", "mentoría para emprendedoras", "acompañamiento a mujeres"],
  orientacion: ["orientación psicológica", "primera sesión de orientación", "no sé qué necesito"],
};

export function generateStaticParams() {
  return SPECIALTY_PAGES.map((p) => ({ especialidad: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ especialidad: string }>;
}): Promise<Metadata> {
  const { especialidad } = await params;
  const page = specialtyPageOf(especialidad);
  if (!page) return {};
  const t = await getDict();
  const copy = t.specialty.pages[page.slug];

  return {
    title: copy.title,
    description: copy.lead,
    keywords: KEYWORDS[page.slug],
    alternates: { canonical: `/acompanamiento/${page.slug}` },
    openGraph: { title: copy.title, description: copy.lead, type: "website" },
  };
}

export default async function EspecialidadPage({
  params,
}: {
  params: Promise<{ especialidad: string }>;
}) {
  const { especialidad } = await params;
  const page = specialtyPageOf(especialidad);
  if (!page) notFound();

  const [locale, t] = await Promise.all([getLocale(), getDict()]);
  const copy = t.specialty.pages[page.slug];

  const services = (
    await db.service.findMany({
      where: { active: true, specialty: page.specialty },
      orderBy: { order: "asc" },
    })
  ).map((s) => serviceView(s, locale));

  const others = SPECIALTY_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <>
      <section className="border-b border-line bg-orchid-soft">
        <div className="shell grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Link
              href="/acompanamiento"
              className="text-[0.8125rem] font-semibold text-orchid-deep hover:underline"
            >
              {t.specialty.back}
            </Link>
            <Eyebrow className="mt-6 text-orchid-deep">{page.specialty}</Eyebrow>
            <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{copy.lead}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/acompanamiento/agenda" tone="orchid">
                {t.specialty.bookHere}
              </ButtonLink>
              <ButtonLink href="/contacto" tone="ghost">
                {t.services.unsureCta}
              </ButtonLink>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <KarenPortrait size={230} />
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
            {copy.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div>
            {services.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white px-6 py-8 text-sm text-muted">
                {t.specialty.noServices}
              </p>
            ) : (
              <div className="space-y-4">
                {services.map((s) => (
                  <article key={s.id} className="card-soft grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl">{s.accentEmoji}</span>
                        <Badge tone="orchid">{s.specialty}</Badge>
                        <Badge tone="muted">{s.modalityLabel}</Badge>
                        <Badge tone="muted">{duration(s.durationMin, locale)}</Badge>
                      </div>
                      <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">
                        <Link
                          href={`/acompanamiento/servicios/${s.slug}`}
                          className="hover:text-orchid-deep"
                        >
                          {s.name}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.summary}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <p className="font-[family-name:var(--font-display)] text-2xl">
                        {money(s.price, locale)}
                      </p>
                      <ButtonLink
                        href={`/acompanamiento/servicios/${s.slug}`}
                        tone="orchid"
                        className="px-5 py-2.5"
                      >
                        {t.services.seeSheet}
                      </ButtonLink>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-shell/50 py-14">
        <div className="shell">
          <p className="eyebrow mb-4 text-muted">{t.specialty.otherAreas}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/acompanamiento/${o.slug}`}
                className="rounded-2xl border border-line bg-white px-5 py-5 transition-colors hover:border-orchid/50"
              >
                <p className="font-[family-name:var(--font-display)] text-lg text-orchid-deep">
                  {t.specialty.pages[o.slug].title}
                </p>
                <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-soft">
                  {t.specialty.pages[o.slug].lead}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

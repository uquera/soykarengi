import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money, duration } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { Badge, ButtonLink, Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [locale, raw] = await Promise.all([getLocale(), db.service.findUnique({ where: { slug } })]);
  if (!raw) return { title: "404" };
  const service = serviceView(raw, locale);
  return { title: service.name, description: service.summary };
}

export default async function ServicioPage({ params }: Props) {
  const { slug } = await params;
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const raw = await db.service.findUnique({ where: { slug } });
  if (!raw || !raw.active) notFound();

  const service = serviceView(raw, locale);
  const others = (
    await db.service.findMany({
      where: { active: true, NOT: { id: service.id } },
      orderBy: { order: "asc" },
      take: 3,
    })
  ).map((s) => serviceView(s, locale));

  return (
    <>
      <div className="border-b border-line bg-orchid-soft/40">
        <div className="shell py-14">
          <Link href="/acompanamiento/servicios" className="text-[0.8125rem] text-muted hover:text-ink">
            {t.services.allServices}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-2xl">{service.accentEmoji}</span>
            <Badge tone="orchid">{service.specialty}</Badge>
          </div>

          <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-balance sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{service.summary}</p>
        </div>
      </div>

      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {/* Ficha de servicio, tal como se definió en la propuesta */}
        <article className="space-y-10">
          <section>
            <Eyebrow className="text-orchid-deep">{t.services.description}</Eyebrow>
            <div className="mt-3 space-y-3 text-[1.0625rem] leading-relaxed text-ink-soft">
              {service.description.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section className="card-soft p-7">
            <Eyebrow className="text-orchid-deep">{t.services.forWho}</Eyebrow>
            <ul className="mt-4 space-y-2.5">
              {service.forWho.split("\n").map((item, i) => (
                <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orchid" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="card-soft p-7">
            <Eyebrow className="text-orchid-deep">{t.services.whatToExpect}</Eyebrow>
            <ul className="mt-4 space-y-2.5">
              {service.whatToExpect.split("\n").map((item, i) => (
                <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Panel de reserva */}
        <aside className="lg:sticky lg:top-28">
          <div className="card-soft overflow-hidden">
            <div className="bg-orchid px-7 py-6 text-white">
              <p className="text-[0.6875rem] font-semibold tracking-[0.18em] uppercase opacity-80">
                {t.services.sessionPrice}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-4xl">
                {service.priceLabel}
              </p>
            </div>

            <dl className="divide-y divide-line px-7">
              <div className="flex items-center justify-between py-4 text-sm">
                <dt className="text-muted">{t.services.modality}</dt>
                <dd className="font-semibold">{service.modalityLabel}</dd>
              </div>
              <div className="flex items-center justify-between py-4 text-sm">
                <dt className="text-muted">{t.services.duration}</dt>
                <dd className="font-semibold">{duration(service.durationMin, locale)}</dd>
              </div>
              <div className="flex items-center justify-between py-4 text-sm">
                <dt className="text-muted">{t.services.specialty}</dt>
                <dd className="font-semibold">{service.specialty}</dd>
              </div>
            </dl>

            <div className="px-7 pb-7">
              <ButtonLink
                href={`/acompanamiento/agenda?servicio=${service.slug}`}
                tone="orchid"
                className="w-full"
              >
                {t.services.book}
              </ButtonLink>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted">{t.services.bookNote}</p>
            </div>
          </div>
        </aside>
      </div>

      {others.length > 0 ? (
        <section className="border-t border-line bg-shell/60 py-16">
          <div className="shell">
            <Eyebrow>{t.services.others}</Eyebrow>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {others.map((s) => (
                <Link
                  key={s.id}
                  href={`/acompanamiento/servicios/${s.slug}`}
                  className="card-soft p-6 transition-transform hover:-translate-y-1"
                >
                  <span className="text-xl">{s.accentEmoji}</span>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-lg leading-snug">{s.name}</p>
                  <p className="mt-2 text-[0.8125rem] text-muted">
                    {duration(s.durationMin, locale)} · {s.priceLabel}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

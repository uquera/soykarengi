import Link from "next/link";
import { db } from "@/lib/db";
import { money, duration } from "@/lib/format";
import { CATEGORY_GROUPS } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView, designView, postView } from "@/lib/content";
import { ButtonLink, Eyebrow, SectionHeading } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";
import { BrandLogo } from "@/components/brand";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const [servicesRaw, designsRaw, postsRaw] = await Promise.all([
    db.service.findMany({ where: { active: true }, orderBy: { order: "asc" }, take: 3 }),
    db.design.findMany({
      where: { active: true, featured: true },
      orderBy: { order: "asc" },
      take: 3,
      include: { category: true },
    }),
    db.post.findMany({ where: { published: true, kind: "BLOG" }, orderBy: { publishedAt: "desc" }, take: 2 }),
  ]);

  const services = servicesRaw.map((s) => serviceView(s, locale));
  const designs = designsRaw.map((d) => designView(d, locale));
  const posts = postsRaw.map((p) => postView(p, locale));

  return (
    <>
      {/* HERO — la home vende el concepto antes que los servicios */}
      <section className="grain relative overflow-hidden border-b border-line">
        <div className="shell relative grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          {/* Dos frases, dos botones y una línea que dice qué hay detrás de cada
              uno. Todo lo demás baja: el hero sólo tiene que hacer elegir. */}
          <div className="rise">
            <Eyebrow>{t.home.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-[2.6rem] leading-[1.05] text-balance sm:text-6xl">
              <span className="text-orchid-deep">{t.home.titleA}</span>{" "}
              <span className="text-moss-deep">{t.home.titleB}</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">{t.home.leadA}</p>
            <p className="mt-2 max-w-xl text-lg leading-relaxed text-ink-soft">{t.home.leadB}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/acompanamiento" tone="orchid" className="px-7 py-3.5">
                {t.home.ctaUnit1}
              </ButtonLink>
              <ButtonLink href="/disenos" tone="moss" className="px-7 py-3.5">
                {t.home.ctaUnit2}
              </ButtonLink>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-[0.8125rem] text-muted sm:flex-row sm:items-center sm:gap-5">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orchid-deep" />
                {t.home.railA}
              </span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-line sm:block" />
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-moss-deep" />
                {t.home.railB}
              </span>
            </div>

            <p className="mt-10 max-w-lg border-l-2 border-sand pl-5 font-[family-name:var(--font-display)] text-lg leading-snug text-ink-soft italic">
              &ldquo;{t.brand.quote}&rdquo;
            </p>
          </div>

          {/* Marca paraguas: dos unidades, una sola cuenta */}
          <div className="rise relative" style={{ animationDelay: "120ms" }}>
            <div className="mb-8 flex flex-col items-center gap-4 lg:items-end">
              <BrandLogo width={280} />
              <p className="font-[family-name:var(--font-display)] text-[0.9375rem] text-orchid-deep italic">
                {t.brand.tagline}
              </p>
            </div>

            <div className="card-soft relative p-7 sm:p-9">
            <p className="eyebrow text-muted">{t.home.archEyebrow}</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl">{t.home.archTitle}</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Link
                href="/acompanamiento"
                className="rounded-2xl border border-orchid/25 bg-orchid-soft/60 p-5 transition-colors hover:border-orchid/50"
              >
                <p className="eyebrow text-orchid-deep">{t.home.unit01}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl text-orchid-deep">
                  {t.home.unit1Name}
                </p>
                <ul className="mt-4 space-y-1.5 text-[0.8125rem] text-ink-soft">
                  {t.home.unit1Items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="mt-5 inline-block text-[0.8125rem] font-semibold text-orchid-deep">
                  {t.home.seeServices}
                </span>
              </Link>

              <Link
                href="/disenos"
                className="rounded-2xl border border-moss/40 bg-moss-soft p-5 transition-colors hover:border-moss-deep/50"
              >
                <p className="eyebrow text-moss-deep">{t.home.unit02}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl text-moss-deep">
                  {t.home.unit2Name}
                </p>
                <ul className="mt-4 space-y-1.5 text-[0.8125rem] text-ink-soft">
                  {t.home.unit2Items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="mt-5 inline-block text-[0.8125rem] font-semibold text-moss-deep">
                  {t.home.seeShowcase}
                </span>
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-shell/70 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm text-cream">
                ✦
              </span>
              <p className="text-[0.8125rem] leading-snug text-ink-soft">
                <span className="font-semibold text-ink">{t.space.label}.</span> {t.home.accountNote}
              </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNIDAD 1 */}
      <section className="shell py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={t.home.servicesEyebrow}
            title={t.home.servicesTitle}
            lead={t.home.servicesLead}
          />
          <ButtonLink href="/acompanamiento/servicios" tone="ghost">
            {t.home.allServices}
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/acompanamiento/servicios/${s.slug}`}
              className="card-soft flex flex-col p-6 transition-transform hover:-translate-y-1"
            >
              <span className="text-2xl">{s.accentEmoji}</span>
              <p className="eyebrow mt-4 text-orchid-deep">{s.specialty}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-snug">{s.name}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{s.summary}</p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[0.8125rem]">
                <span className="text-muted">
                  {duration(s.durationMin, locale)} · {s.modalityLabel}
                </span>
                <span className="font-semibold">{money(s.price, locale)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* UNIDAD 2 */}
      <section className="border-y border-line bg-shell/60 py-20">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={t.home.designsEyebrow}
              title={t.home.designsTitle}
              lead={t.home.designsLead}
            />
            <ButtonLink href="/configurador" tone="moss">
              {t.home.createMine}
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {designs.map((d) => (
              <Link
                key={d.id}
                href={`/disenos/${d.slug}`}
                className="card-soft overflow-hidden transition-transform hover:-translate-y-1"
              >
                <DesignVisual slug={d.slug} palette={d.palette} label={d.categoryName} image={d.image} alt={d.name} className="h-44" />
                <div className="p-6">
                  <p className="font-[family-name:var(--font-display)] text-xl leading-snug">{d.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.tagline}</p>
                  <p className="mt-5 text-[0.8125rem] text-muted">
                    {t.designs.from}{" "}
                    <span className="font-semibold text-ink">{money(d.basePrice, locale)}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CATEGORY_GROUPS.map((g) => (
              <Link
                key={g.key}
                href={`/disenos?grupo=${g.key}`}
                className="rounded-2xl border border-line bg-white px-5 py-4 transition-colors hover:border-moss/60"
              >
                <p className="font-semibold">{t.designs.groups[g.key].name}</p>
                <p className="mt-1 text-[0.8125rem] text-ink-soft">{t.designs.groups[g.key].blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIGURADOR */}
      <section className="shell py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow={t.home.configEyebrow}
            title={t.home.configTitle}
            lead={t.home.configLead}
          />

          <ol className="grid gap-3 sm:grid-cols-2">
            {t.home.configSteps.map(([n, title, body]) => (
              <li key={n} className="rounded-2xl border border-line bg-white p-5">
                <span className="font-[family-name:var(--font-display)] text-sm text-moss-deep">{n}</span>
                <p className="mt-2 font-semibold">{title}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CONTENIDOS */}
      {posts.length > 0 ? (
        <section className="shell pb-24">
          <SectionHeading eyebrow={t.home.postsEyebrow} title={t.home.postsTitle} />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="card-soft p-6 transition-transform hover:-translate-y-1"
              >
                <p className="eyebrow text-rose">{p.tag}</p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">{p.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>
                <p className="mt-5 text-xs text-muted">
                  {p.readMinutes} {t.blog.readTime}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* CIERRE */}
      <section className="shell pb-24">
        <div className="grain relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-cream sm:px-14">
          <div className="relative max-w-2xl">
            <p className="eyebrow text-cream/60">{t.home.closingEyebrow}</p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-3xl leading-tight text-balance sm:text-4xl">
              {t.home.closingTitle}
            </p>
            <p className="mt-4 text-cream/70">{t.home.closingLead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/acompanamiento/agenda" tone="orchid">
                {t.home.closingCtaA}
              </ButtonLink>
              <ButtonLink
                href="/configurador"
                tone="ghost"
                className="border-cream/25 bg-transparent text-cream hover:border-cream/60 hover:bg-cream/10"
              >
                {t.home.closingCtaB}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

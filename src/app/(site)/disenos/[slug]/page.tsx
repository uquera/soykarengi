import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { designView } from "@/lib/content";
import { toggleFavoriteAction } from "@/lib/actions/designs";
import { Badge, ButtonLink, Eyebrow } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [locale, raw] = await Promise.all([
    getLocale(),
    db.design.findUnique({ where: { slug }, include: { category: true } }),
  ]);
  if (!raw) return { title: "404" };
  const design = designView(raw, locale);
  return { title: design.name, description: design.tagline };
}

export default async function DisenoPage({ params }: Props) {
  const { slug } = await params;
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const raw = await db.design.findUnique({ where: { slug }, include: { category: true } });
  if (!raw || !raw.active) notFound();

  const design = designView(raw, locale);

  const [user, relatedRaw] = await Promise.all([
    getCurrentUser(),
    db.design.findMany({
      where: { active: true, categoryId: design.categoryId, NOT: { id: design.id } },
      orderBy: { order: "asc" },
      take: 3,
      include: { category: true },
    }),
  ]);

  const related = relatedRaw.map((d) => designView(d, locale));

  const favorite = user
    ? await db.favorite.findUnique({ where: { userId_designId: { userId: user.id, designId: design.id } } })
    : null;

  const fields = design.customFields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <>
      <div className="shell grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <Link href="/disenos" className="text-[0.8125rem] text-muted hover:text-ink">
            {t.designs.backToShowcase}
          </Link>
          <div className="card-soft mt-5 overflow-hidden">
            <DesignVisual slug={design.slug} palette={design.palette} className="aspect-[4/3] w-full" />
          </div>
        </div>

        <div className="lg:pt-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="clay">{design.categoryName}</Badge>
            {design.featured ? <Badge tone="gold">{t.designs.featured}</Badge> : null}
          </div>

          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-balance">
            {design.name}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{design.tagline}</p>

          <div className="mt-7 space-y-3 leading-relaxed text-ink-soft">
            {design.description.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="card-soft mt-9 p-6">
            <Eyebrow className="text-clay-deep">{t.designs.customize}</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2">
              {fields.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-clay/25 bg-clay-soft/70 px-3.5 py-1.5 text-[0.8125rem] text-clay-deep"
                >
                  {f}
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t.designs.delivery}</dt>
                <dd className="text-right font-semibold">{design.delivery}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">{t.designs.from}</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl">
                  {money(design.basePrice, locale)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/configurador?diseno=${design.slug}`} tone="clay" className="flex-1">
                {t.designs.customizeCta}
              </ButtonLink>

              <form action={toggleFavoriteAction}>
                <input type="hidden" name="designId" value={design.id} />
                <button
                  type="submit"
                  className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                    favorite
                      ? "border-clay bg-clay-soft text-clay-deep"
                      : "border-line bg-white text-ink-soft hover:border-ink/40"
                  }`}
                >
                  {favorite ? t.designs.saved : t.designs.save}
                </button>
              </form>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted">{t.designs.priceNote}</p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-line bg-shell/60 py-16">
          <div className="shell">
            <Eyebrow>
              {t.designs.moreIn} {design.categoryName}
            </Eyebrow>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {related.map((d) => (
                <Link
                  key={d.id}
                  href={`/disenos/${d.slug}`}
                  className="card-soft overflow-hidden transition-transform hover:-translate-y-1"
                >
                  <DesignVisual slug={d.slug} palette={d.palette} className="h-40" />
                  <div className="p-5">
                    <p className="font-[family-name:var(--font-display)] text-lg leading-snug">{d.name}</p>
                    <p className="mt-2 text-[0.8125rem] text-muted">
                      {t.designs.from} {money(d.basePrice, locale)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { CATEGORY_GROUPS } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { categoryView, designView } from "@/lib/content";
import { ButtonLink, Eyebrow, Badge, EmptyState } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";
import { CustomDesignCall } from "@/components/custom-design-call";

export const dynamic = "force-dynamic";

/**
 * Cada categoría con su URL y su contenido propio. Es lo que pide el punto de
 * SEO del documento: "regalos personalizados" o "invitaciones personalizadas"
 * son búsquedas reales y merecen una página, no un parámetro en la vitrina.
 */
async function load(slug: string) {
  return db.designCategory.findFirst({ where: { slug, active: true } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [locale, row] = await Promise.all([getLocale(), load(slug)]);
  if (!row) return {};
  const c = categoryView(row, locale);

  return {
    title: c.name,
    description: c.description,
    keywords: [c.name.toLowerCase(), "diseños personalizados", "SoyKarengi"],
    alternates: { canonical: `/disenos/categoria/${c.slug}` },
    openGraph: { title: c.name, description: c.description, type: "website" },
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, t, row] = await Promise.all([getLocale(), getDict(), load(slug)]);
  if (!row) notFound();

  const category = categoryView(row, locale);

  const [designsRaw, siblingsRaw] = await Promise.all([
    db.design.findMany({
      where: { active: true, categoryId: category.id },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      include: { category: true },
    }),
    db.designCategory.findMany({
      where: { active: true, group: category.group, NOT: { id: category.id } },
      orderBy: { order: "asc" },
    }),
  ]);

  const designs = designsRaw.map((d) => designView(d, locale));
  const siblings = siblingsRaw.map((c) => categoryView(c, locale));
  const group = CATEGORY_GROUPS.find((g) => g.key === category.group);

  return (
    <>
      <section className="border-b border-line bg-moss-soft">
        <div className="shell py-14">
          <Link
            href={group ? `/disenos?grupo=${group.key}` : "/disenos"}
            className="text-[0.8125rem] font-semibold text-moss-deep hover:underline"
          >
            {t.designs.backToShowcase}
          </Link>
          <Eyebrow className="mt-6 text-moss-deep">
            {group ? t.designs.groups[group.key].name : t.designs.eyebrow}
          </Eyebrow>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
            {category.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{category.description}</p>
          <p className="mt-5 text-sm text-muted">
            {designs.length} {designs.length === 1 ? t.designs.piece : t.designs.pieces}{" "}
            {t.designs.inCategory}
          </p>
        </div>
      </section>

      <section className="shell py-14">
        {designs.length === 0 ? (
          <EmptyState
            title={t.designs.emptyTitle}
            lead={t.designs.emptyLead}
            action={
              <ButtonLink href="/configurador" tone="moss" className="mt-2">
                {t.designs.emptyCta}
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <Link
                key={d.id}
                href={`/disenos/${d.slug}`}
                className="card-soft flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
              >
                <DesignVisual
                  slug={d.slug}
                  palette={d.palette}
                  label={d.categoryName}
                  image={d.image}
                  alt={d.name}
                  className="h-52"
                />
                <div className="flex flex-1 flex-col p-6">
                  {d.featured ? (
                    <span className="mb-3 self-start">
                      <Badge tone="amber">{t.designs.featured}</Badge>
                    </span>
                  ) : null}
                  <p className="font-[family-name:var(--font-display)] text-xl leading-snug">{d.name}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{d.tagline}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-[0.8125rem]">
                    <span className="text-muted">{d.delivery}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {t.designs.from} {money(d.basePrice, locale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {siblings.length > 0 ? (
          <div className="mt-14 border-t border-line pt-8">
            <p className="eyebrow mb-4 text-muted">
              {t.designs.moreIn} {group ? t.designs.groups[group.key].name : t.designs.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {siblings.map((c) => (
                <Link
                  key={c.id}
                  href={`/disenos/categoria/${c.slug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-moss/70"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <CustomDesignCall
        copy={{
          eyebrow: t.designs.customEyebrow,
          title: t.designs.customTitle,
          lead: t.designs.customLead,
          items: t.designs.customItems,
          note: t.designs.customNote,
          cta: t.designs.customCta,
        }}
      />
    </>
  );
}

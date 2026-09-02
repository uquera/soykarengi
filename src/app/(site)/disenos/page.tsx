import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { CATEGORY_GROUPS } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { categoryView, designView } from "@/lib/content";
import { ButtonLink, Eyebrow, Badge, EmptyState } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.designs.title, description: t.designs.lead };
}

export default async function DisenosPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string; categoria?: string }>;
}) {
  const { grupo, categoria } = await searchParams;
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const categories = (
    await db.designCategory.findMany({
      where: { active: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
    })
  ).map((c) => categoryView(c, locale));

  const designs = (
    await db.design.findMany({
      where: {
        active: true,
        ...(categoria ? { category: { slug: categoria } } : {}),
        ...(grupo && !categoria ? { category: { group: grupo } } : {}),
      },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      include: { category: true },
    })
  ).map((d) => designView(d, locale));

  const activeGroup = CATEGORY_GROUPS.find((g) => g.key === grupo);
  const activeCategory = categories.find((c) => c.slug === categoria);

  return (
    <>
      <section className="border-b border-line bg-rose-soft/40">
        <div className="shell grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Eyebrow className="text-rose-deep">{t.designs.eyebrow}</Eyebrow>
            <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
              {t.designs.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.designs.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/configurador" tone="rose">
                {t.designs.cta}
              </ButtonLink>
            </div>
          </div>

          {/* Piezas reales, no ilustraciones: es lo que de verdad se entrega. */}
          <div className="grid grid-cols-2 gap-4">
            <img
              src="/producto-tote.jpg"
              alt="Bolso de tela con la frase «Soy mi proyecto más importante»"
              className="aspect-square w-full rounded-3xl border border-line object-cover shadow-sm"
            />
            <img
              src="/producto-renacer.jpg"
              alt="Polera Renacer Venezuela dentro de su caja de regalo"
              className="mt-8 aspect-square w-full rounded-3xl border border-line object-cover shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Filtros: grupo y categoría */}
      <div className="border-b border-line bg-cream/90">
        <div className="shell flex flex-wrap items-center gap-2 py-5">
          <Link
            href="/disenos"
            className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
              !grupo && !categoria ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
            }`}
          >
            {t.designs.all}
          </Link>
          {CATEGORY_GROUPS.map((g) => (
            <Link
              key={g.key}
              href={`/disenos?grupo=${g.key}`}
              className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                grupo === g.key && !categoria
                  ? "border-rose bg-rose text-white"
                  : "border-line bg-white hover:border-rose/40"
              }`}
            >
              {t.designs.groups[g.key].name}
            </Link>
          ))}
        </div>

        {grupo ? (
          <div className="shell flex flex-wrap items-center gap-2 pb-5">
            {categories
              .filter((c) => c.group === grupo)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/disenos?grupo=${grupo}&categoria=${c.slug}`}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.75rem] transition-colors ${
                    categoria === c.slug
                      ? "border-rose-deep bg-rose-soft text-rose-deep"
                      : "border-line bg-white text-ink-soft hover:border-rose/40"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
          </div>
        ) : null}
      </div>

      <section className="shell py-14">
        {activeCategory ? (
          <header className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">{activeCategory.name}</h2>
            <p className="mt-2 text-ink-soft">{activeCategory.description}</p>
          </header>
        ) : activeGroup ? (
          <header className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl">
              {t.designs.groups[activeGroup.key].name}
            </h2>
            <p className="mt-2 text-ink-soft">{t.designs.groups[activeGroup.key].blurb}</p>
          </header>
        ) : null}

        {designs.length === 0 ? (
          <EmptyState
            title={t.designs.emptyTitle}
            lead={t.designs.emptyLead}
            action={
              <ButtonLink href="/configurador" tone="rose" className="mt-2">
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
                <DesignVisual slug={d.slug} palette={d.palette} label={d.categoryName} image={d.image} alt={d.name} className="h-52" />
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
      </section>

      <section className="border-t border-line bg-shell/60 py-16">
        <div className="shell grid gap-8 rounded-3xl md:grid-cols-2 md:items-center lg:grid-cols-[1fr_0.7fr_0.9fr]">
          <div>
            <Eyebrow className="text-rose-deep">{t.designs.expEyebrow}</Eyebrow>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-balance">
              {t.designs.expTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{t.designs.expLead}</p>
            <ButtonLink href="/configurador" tone="rose" className="mt-7">
              {t.designs.expCta}
            </ButtonLink>
          </div>

          <div className="order-last md:order-none">
            <img
              src="/sparkwell-caja.jpg"
              alt="Caja de regalo con el mensaje «Siempre es posible renacer»"
              className="w-full rounded-3xl border border-line object-cover shadow-sm"
            />
          </div>

          <ol className="space-y-2 text-sm md:col-span-2 lg:col-span-1">
            {t.designs.flow.map((step, i) => (
              <li key={step} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-soft text-[0.6875rem] font-semibold text-rose-deep">
                  {i + 1}
                </span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

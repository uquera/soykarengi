import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { CATEGORY_GROUPS, INTENTS, intentOf, matchesIntent } from "@/lib/domain";
import { getDict, getLocale } from "@/lib/i18n";
import { categoryView, designView } from "@/lib/content";
import { ButtonLink, Eyebrow, Badge, EmptyState } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";
import { CustomDesignCall } from "@/components/custom-design-call";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.designs.title,
    description: t.designs.lead,
    keywords: [
      "diseños personalizados",
      "regalos personalizados",
      "diseños para homenajes",
      "invitaciones personalizadas",
      "diseños para eventos",
    ],
    alternates: { canonical: "/disenos" },
  };
}

export default async function DisenosPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string; categoria?: string; buscas?: string }>;
}) {
  const { grupo, categoria, buscas } = await searchParams;
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const categories = (
    await db.designCategory.findMany({
      where: { active: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
    })
  ).map((c) => categoryView(c, locale));

  const activeIntent = intentOf(buscas);

  const rows = await db.design.findMany({
    where: {
      active: true,
      ...(categoria ? { category: { slug: categoria } } : {}),
      ...(grupo && !categoria ? { category: { group: grupo } } : {}),
    },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
    include: { category: true },
  });

  // La intención se resuelve en memoria: es una lista corta y el campo `intents`
  // guarda varias claves separadas por coma, que SQLite no sabe consultar.
  const designs = (activeIntent ? rows.filter((d) => matchesIntent(d, activeIntent.key)) : rows).map((d) =>
    designView(d, locale),
  );

  const activeGroup = CATEGORY_GROUPS.find((g) => g.key === grupo);
  const activeCategory = categories.find((c) => c.slug === categoria);

  const keep = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { grupo, categoria, buscas, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const q = params.toString();
    return q ? `/disenos?${q}` : "/disenos";
  };

  return (
    <>
      <section className="border-b border-line bg-moss-soft">
        <div className="shell grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Eyebrow className="text-moss-deep">{t.designs.eyebrow}</Eyebrow>
            <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
              {t.designs.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.designs.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/configurador" tone="moss">
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

      {/* Filtro por intención: el cliente no busca "PERSONAL", busca regalar. */}
      <section className="border-b border-line bg-cream/90">
        <div className="shell py-7">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-[family-name:var(--font-display)] text-xl">{t.designs.lookingFor}</h2>
            <p className="text-[0.8125rem] text-muted">{t.designs.lookingForLead}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {INTENTS.map((intent) => {
              const active = buscas === intent.key;
              return (
                <Link
                  key={intent.key}
                  href={active ? keep({ buscas: undefined }) : keep({ buscas: intent.key })}
                  className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                    active
                      ? "border-moss-deep bg-moss-deep text-cream"
                      : "border-line bg-white hover:border-moss-deep/50"
                  }`}
                >
                  {t.designs.intents[intent.key]}
                </Link>
              );
            })}
            <Link
              href="/configurador"
              className="rounded-full border border-dashed border-moss-deep/50 px-4 py-2 text-[0.8125rem] font-semibold text-moss-deep transition-colors hover:bg-moss-soft"
            >
              {t.designs.intents.crear} →
            </Link>
          </div>
        </div>
      </section>

      {/* Filtros de catálogo: grupo y categoría */}
      <div className="border-b border-line bg-white/60">
        <div className="shell flex flex-wrap items-center gap-2 py-5">
          <Link
            href={buscas ? `/disenos?buscas=${buscas}` : "/disenos"}
            className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
              !grupo && !categoria ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
            }`}
          >
            {t.designs.all}
          </Link>
          {CATEGORY_GROUPS.map((g) => (
            <Link
              key={g.key}
              href={keep({ grupo: g.key, categoria: undefined })}
              className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                grupo === g.key && !categoria
                  ? "border-moss-deep bg-moss text-moss-deep"
                  : "border-line bg-white hover:border-moss/70"
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
                  href={`/disenos/categoria/${c.slug}`}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[0.75rem] text-ink-soft transition-colors hover:border-moss/70"
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

        {activeIntent ? (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Badge tone="moss">{t.designs.intents[activeIntent.key]}</Badge>
            <span className="text-sm text-muted">
              {designs.length} {designs.length === 1 ? t.designs.piece : t.designs.pieces}
            </span>
            <Link
              href={keep({ buscas: undefined })}
              className="text-[0.8125rem] font-semibold text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              {t.designs.clearIntent}
            </Link>
          </div>
        ) : null}

        {designs.length === 0 ? (
          <EmptyState
            title={activeIntent ? t.designs.noIntentTitle : t.designs.emptyTitle}
            lead={activeIntent ? t.designs.noIntentLead : t.designs.emptyLead}
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

      {/* El bloque de arriba ya hace la llamada; aquí sólo se explica el proceso. */}
      <section className="border-t border-line bg-shell/50 py-16">
        <div className="shell grid gap-8 rounded-3xl md:grid-cols-2 md:items-center lg:grid-cols-[0.9fr_0.7fr_1fr]">
          <div>
            <Eyebrow className="text-moss-deep">{t.designs.expEyebrow}</Eyebrow>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-balance">
              {t.configurator.afterTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{t.designs.expLead}</p>
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
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss-soft text-[0.6875rem] font-semibold text-moss-deep">
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

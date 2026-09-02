import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { designView } from "@/lib/content";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { Configurator } from "./configurator";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.configurator.title, description: t.configurator.lead };
}

export default async function ConfiguradorPage({
  searchParams,
}: {
  searchParams: Promise<{ diseno?: string }>;
}) {
  const { diseno } = await searchParams;

  const [session, locale, t, designsRaw] = await Promise.all([
    getSession(),
    getLocale(),
    getDict(),
    db.design.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      include: { category: true },
    }),
  ]);

  const designs = designsRaw.map((d) => designView(d, locale));
  const initialDesignId = diseno ? (designs.find((d) => d.slug === diseno)?.id ?? "") : "";

  return (
    <div className="shell grid gap-14 py-16 lg:grid-cols-[1fr_19rem] lg:items-start">
      <div className="min-w-0">
        <Eyebrow className="text-rose-deep">{t.configurator.eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
          {t.configurator.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.configurator.lead}</p>

        <div className="mt-12">
          {session ? (
            <Configurator
              designs={designs.map((d) => ({
                id: d.id,
                name: d.name,
                basePrice: d.basePrice,
                categoryName: d.categoryName,
              }))}
              initialDesignId={initialDesignId}
              locale={locale}
              copy={{
                steps: t.configurator.steps,
                q1: t.configurator.q1,
                q1Lead: t.configurator.q1Lead,
                q2: t.configurator.q2,
                q2Lead: t.configurator.q2Lead,
                recipientLabel: t.configurator.recipientLabel,
                recipientPlaceholder: t.configurator.recipientPlaceholder,
                baseLabel: t.configurator.baseLabel,
                baseHint: t.configurator.baseHint,
                baseNone: t.configurator.baseNone,
                from: t.configurator.from,
                q3: t.configurator.q3,
                q3Lead: t.configurator.q3Lead,
                q4: t.configurator.q4,
                q4Lead: t.configurator.q4Lead,
                dateLabel: t.configurator.dateLabel,
                optional: t.configurator.optional,
                quantityLabel: t.configurator.quantityLabel,
                formatLabel: t.configurator.formatLabel,
                detailsLabel: t.configurator.detailsLabel,
                detailsHint: t.configurator.detailsHint,
                detailsPlaceholder: t.configurator.detailsPlaceholder,
                filesLabel: t.configurator.filesLabel,
                filesHint: t.configurator.filesHint,
                q5: t.configurator.q5,
                q5Lead: t.configurator.q5Lead,
                ideaPlaceholder: t.configurator.ideaPlaceholder,
                chars: t.configurator.chars,
                summary: t.configurator.summary,
                sumWhat: t.configurator.sumWhat,
                sumWho: t.configurator.sumWho,
                sumFeel: t.configurator.sumFeel,
                sumBase: t.configurator.sumBase,
                sumFromScratch: t.configurator.sumFromScratch,
                submit: t.configurator.submit,
                sending: t.configurator.sending,
                submitNote: t.configurator.submitNote,
                back: t.configurator.back,
                next: t.configurator.next,
                lastStep: t.configurator.lastStep,
                purposeHints: t.configurator.purposes,
                purposeLabels: t.vocab.purposes,
                emotionLabels: t.vocab.emotions,
                formatLabels: t.vocab.formats,
              }}
            />
          ) : (
            <div className="card-soft px-8 py-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl">{t.configurator.gateTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                {t.configurator.gateLead}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/registro?next=/configurador" tone="rose">
                  {t.configurator.gateCreate}
                </ButtonLink>
                <ButtonLink href="/ingresar?next=/configurador" tone="ghost">
                  {t.configurator.gateHave}
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="card-soft p-6">
          <p className="eyebrow text-muted">{t.configurator.afterTitle}</p>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            {t.configurator.afterSteps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-soft text-[0.625rem] font-semibold text-rose-deep">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-line bg-shell/70 p-6 text-sm leading-relaxed text-ink-soft">
          {t.configurator.afterNote}
        </div>
      </aside>
    </div>
  );
}

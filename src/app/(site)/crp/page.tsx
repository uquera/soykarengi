import type { Metadata } from "next";
import { db } from "@/lib/db";
import { duration } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { serviceView } from "@/lib/content";
import { ButtonLink, Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Karen pidió sacar «CRP» del nombre de las mentorías y darle un módulo propio.
 * Esta página es ese módulo: explica de dónde vienen las herramientas y sirve
 * de acreditación, sin mezclarse con el nombre comercial del servicio.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.crp.title,
    description: t.crp.lead,
    keywords: ["Círculo de Realización Personal", "CRP", "entrenamiento mental", "Máster Trainer"],
    alternates: { canonical: "/crp" },
  };
}

export default async function CrpPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const raw = await db.service.findFirst({ where: { slug: "mentorias", active: true } });
  const mentorias = raw ? serviceView(raw, locale) : null;

  return (
    <>
      <section className="border-b border-line bg-orchid-soft/60">
        <div className="shell grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rise">
            <Eyebrow className="text-orchid-deep">{t.crp.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-balance sm:text-5xl">
              {t.crp.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t.crp.lead}</p>
            <ButtonLink href="/acompanamiento/servicios/mentorias" tone="orchid" className="mt-9">
              {t.crp.cta}
            </ButtonLink>
          </div>

          {/* El logo es de terceros: va sobre blanco y sin recolorear. */}
          <div className="rise flex justify-center lg:justify-end" style={{ animationDelay: "100ms" }}>
            <div className="card-soft grid place-items-center px-10 py-10">
              <img
                src="/crp-logo.png"
                alt="Círculo de Realización Personal"
                width={230}
                height={249}
                style={{ width: 230, height: "auto" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.15] text-balance">
              {t.crp.whatTitle}
            </h2>
            <div className="mt-5 space-y-4 text-[1.0625rem] leading-relaxed text-ink-soft">
              {t.crp.whatBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-5 text-muted">{t.crp.pillarsTitle}</p>
            <ul className="space-y-4">
              {t.crp.pillars.map((p, i) => (
                <li key={p.title} className="card-soft flex gap-5 p-6">
                  <span className="font-[family-name:var(--font-display)] text-2xl text-orchid-deep tabular-nums">
                    0{i + 1}
                  </span>
                  <span>
                    <span className="block font-[family-name:var(--font-display)] text-xl">{p.title}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">{p.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {mentorias ? (
        <section className="shell pb-20">
          <div className="card-soft grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Eyebrow className="text-orchid-deep">{mentorias.specialty}</Eyebrow>
              <p className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-snug">
                {mentorias.name}
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">{mentorias.summary}</p>
              <p className="mt-5 text-[0.8125rem] text-muted">
                {duration(mentorias.durationMin, locale)} · {mentorias.modalityLabel} ·{" "}
                {mentorias.priceLabel}
              </p>
              <p className="mt-6 text-[0.8125rem] leading-relaxed text-muted">{t.crp.ctaNote}</p>
            </div>

            <div className="flex flex-col gap-3">
              <ButtonLink href="/acompanamiento/servicios/mentorias" tone="orchid">
                {t.services.seeSheet}
              </ButtonLink>
              <ButtonLink href="/acompanamiento/agenda?servicio=mentorias" tone="ghost">
                {t.services.book}
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-line bg-shell/50 py-12">
        <div className="shell flex flex-wrap items-center gap-6">
          <img
            src="/crp-buho.png"
            alt=""
            aria-hidden="true"
            width={64}
            height={64}
            style={{ width: 64, height: 64 }}
          />
          <p className="max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
            <span className="font-semibold text-ink-soft">{t.crp.creditTitle}.</span> {t.crp.creditBody}
          </p>
        </div>
      </section>
    </>
  );
}

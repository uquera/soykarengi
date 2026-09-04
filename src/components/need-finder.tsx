"use client";

import Link from "next/link";
import { useState } from "react";
import { NEEDS } from "@/lib/domain";

export type FinderService = {
  slug: string;
  name: string;
  summary: string;
  specialty: string;
  price: string;
  duration: string;
};

/**
 * Antes de reservar: seis maneras de nombrar lo que a alguien le pasa.
 * La persona que no sabe qué servicio elegir suele saber muy bien cómo se
 * siente, así que preguntamos por ahí y nosotros traducimos a un servicio.
 * Si no hay un servicio de esa especialidad, cae a la conversación de
 * orientación, que es la respuesta correcta cuando no hay certeza.
 */
export function NeedFinder({
  services,
  copy,
}: {
  services: FinderService[];
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    options: Record<string, string>;
    resultEyebrow: string;
    resultLead: string;
    seeSheet: string;
    book: string;
    again: string;
    note: string;
  };
}) {
  const [need, setNeed] = useState<string | null>(null);

  const match = need ? NEEDS.find((n) => n.key === need) : null;
  const fallback = services.find((s) => s.specialty === "Orientación") ?? services[0];
  const suggestion = match
    ? (services.find((s) => s.specialty === match.specialty) ?? fallback)
    : undefined;

  return (
    <section className="card-soft overflow-hidden">
      <div className="border-b border-line bg-orchid-soft px-7 py-6">
        <p className="eyebrow text-orchid-deep">{copy.eyebrow}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{copy.title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{copy.lead}</p>
      </div>

      <div className="p-7">
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setNeed(n.key)}
              aria-pressed={need === n.key}
              className={`rounded-full border px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
                need === n.key
                  ? "border-orchid-deep bg-orchid-deep text-cream"
                  : "border-line bg-white text-ink-soft hover:border-orchid/60 hover:text-ink"
              }`}
            >
              {copy.options[n.key]}
            </button>
          ))}
        </div>

        {suggestion ? (
          <div className="mt-7 rounded-2xl border border-orchid/25 bg-orchid-soft/70 p-6">
            <p className="eyebrow text-orchid-deep">{copy.resultEyebrow}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {copy.resultLead}{" "}
              <span className="font-[family-name:var(--font-display)] text-lg text-ink">
                {suggestion.name}
              </span>
              .
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{suggestion.summary}</p>
            <p className="mt-3 text-[0.8125rem] text-muted">
              {suggestion.duration} · {suggestion.price}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/acompanamiento/agenda?servicio=${suggestion.slug}`}
                className="inline-flex rounded-full bg-orchid-deep px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-orchid"
              >
                {copy.book} · {suggestion.name}
              </Link>
              <Link
                href={`/acompanamiento/servicios/${suggestion.slug}`}
                className="text-[0.8125rem] font-semibold text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                {copy.seeSheet}
              </Link>
              <button
                type="button"
                onClick={() => setNeed(null)}
                className="text-[0.8125rem] text-muted underline underline-offset-4 hover:text-ink"
              >
                {copy.again}
              </button>
            </div>

            <p className="mt-5 border-t border-orchid/20 pt-4 text-xs leading-relaxed text-muted">
              {copy.note}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

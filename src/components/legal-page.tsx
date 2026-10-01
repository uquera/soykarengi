import { bloquesLegales, documentoVigente, LEGAL_META, type TipoLegal } from "@/lib/legal";
import { getConfig } from "@/lib/config";
import { getLocale } from "@/lib/i18n";
import { longDate } from "@/lib/format";
import Link from "next/link";

/** Página pública de un documento legal: siempre la versión vigente. */
export async function LegalPage({ tipo }: { tipo: TipoLegal }) {
  const [doc, config, locale] = await Promise.all([documentoVigente(tipo), getConfig(), getLocale()]);
  const bloques = bloquesLegales(doc.contenido);
  const otros = (Object.keys(LEGAL_META) as TipoLegal[]).filter((t) => t !== tipo);

  return (
    <div className="shell max-w-3xl py-16">
      <p className="eyebrow text-muted">{locale === "en" ? "Legal" : "Información legal"}</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">{doc.titulo}</h1>
      <p className="mt-3 text-sm text-muted">
        {locale === "en" ? "Version" : "Versión"} {doc.version} ·{" "}
        {locale === "en" ? "in force since" : "vigente desde el"} {longDate(doc.createdAt, locale)}
      </p>
      {locale === "en" ? (
        <p className="mt-4 rounded-xl border border-line bg-shell/60 px-4 py-3 text-sm text-ink-soft">
          This document is available in Spanish. If you need help understanding any part of it, write to us.
        </p>
      ) : null}

      <article className="mt-10 space-y-4">
        {bloques.map((b, i) =>
          b.tipo === "titulo" ? (
            <h2 key={i} className="pt-4 font-[family-name:var(--font-display)] text-2xl">
              {b.texto}
            </h2>
          ) : (
            <p key={i} className="leading-relaxed text-ink-soft">
              {b.texto}
            </p>
          ),
        )}
      </article>

      {config.contactoEmail ? (
        <div className="mt-12 rounded-2xl border border-line bg-shell/60 p-6 text-sm text-ink-soft">
          {locale === "en" ? "Questions about this document? Write to " : "¿Preguntas sobre este documento? Escribe a "}
          <a href={`mailto:${config.contactoEmail}`} className="font-semibold text-ink underline underline-offset-2">
            {config.contactoEmail}
          </a>
          .
        </div>
      ) : null}

      <nav className="mt-8 flex flex-wrap gap-4 text-sm">
        {otros.map((t) => (
          <Link key={t} href={LEGAL_META[t].ruta} className="text-muted underline underline-offset-2 hover:text-ink">
            {LEGAL_META[t].titulo}
          </Link>
        ))}
      </nav>
    </div>
  );
}

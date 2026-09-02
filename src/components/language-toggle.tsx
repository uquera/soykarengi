import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n";

/**
 * Cambio de idioma discreto: dos letras, sin menú desplegable.
 * Es un form con server action, así que funciona incluso sin JavaScript.
 */
export function LanguageToggle({
  locale,
  tone = "light",
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const base =
    tone === "dark"
      ? { wrap: "border-cream/20", on: "bg-cream/15 text-cream", off: "text-cream/50 hover:text-cream/80" }
      : { wrap: "border-line", on: "bg-ink text-cream", off: "text-muted hover:text-ink" };

  return (
    <form
      action={setLocaleAction}
      className={`inline-flex items-center rounded-full border ${base.wrap} p-0.5`}
      aria-label={locale === "en" ? "Language" : "Idioma"}
    >
      {(["es", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="submit"
          name="locale"
          value={code}
          aria-current={locale === code ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase transition-colors ${
            locale === code ? base.on : base.off
          }`}
        >
          {code}
        </button>
      ))}
    </form>
  );
}

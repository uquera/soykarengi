import { ButtonLink } from "@/components/ui";

/**
 * «Tu idea. Tu historia. Tu diseño.»
 * El bloque que recoge a quien recorrió la vitrina y no encontró su pieza:
 * en vez de dejarlo salir, le dice exactamente qué puede mandarnos.
 */
export function CustomDesignCall({
  copy,
}: {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: readonly string[];
    note: string;
    cta: string;
  };
}) {
  return (
    <section className="shell pb-16">
      <div className="grain relative overflow-hidden rounded-3xl bg-moss-deep px-8 py-14 text-cream sm:px-14">
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow text-cream/60">{copy.eyebrow}</p>
            <p className="mt-4 max-w-lg font-[family-name:var(--font-display)] text-3xl leading-tight text-balance sm:text-4xl">
              {copy.title}
            </p>
            <p className="mt-4 max-w-md text-cream/75">{copy.lead}</p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {copy.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-cream/25 px-4 py-2 text-[0.8125rem] text-cream/90"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-7 font-[family-name:var(--font-display)] text-xl italic">{copy.note}</p>

            <ButtonLink
              href="/configurador"
              tone="ghost"
              className="mt-7 border-cream/30 bg-cream text-moss-deep hover:border-cream hover:bg-cream/90"
            >
              {copy.cta}
            </ButtonLink>
          </div>

          <div className="hidden lg:block">
            <img
              src="/sparkwell-marca.jpg"
              alt="SparkWell by Karengi"
              className="w-full rounded-3xl border border-cream/15 object-cover opacity-95"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

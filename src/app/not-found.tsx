import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { BrandMark } from "@/components/brand";

/** Antes caía la página por defecto de Next, en inglés y sin marca. */
export default async function NotFound() {
  const en = (await getLocale()) === "en";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
      <BrandMark size={64} />
      <p className="eyebrow mt-8 text-muted">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
        {en ? "This page doesn't exist" : "Esta página no existe"}
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        {en
          ? "Maybe the link changed or the page was removed. You can start over from here."
          : "Puede que el enlace haya cambiado o que la página ya no esté. Puedes volver a empezar desde aquí."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream hover:bg-ink-soft">
          {en ? "Go to home" : "Ir al inicio"}
        </Link>
        <Link
          href="/contacto"
          className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink-soft hover:border-ink/40"
        >
          {en ? "Contact" : "Contacto"}
        </Link>
      </div>
    </main>
  );
}

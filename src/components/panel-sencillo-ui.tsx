import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Piezas visuales del panel sencillo: tarjetas con una línea de contexto, un
 * título que nombra a la persona y botones grandes, fáciles de tocar.
 */

export const BTN = {
  principal:
    "inline-flex flex-1 items-center justify-center rounded-2xl bg-ink px-5 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-ink-soft",
  confirmar:
    "inline-flex flex-1 items-center justify-center rounded-2xl bg-moss-deep px-5 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-moss-deep/85",
  secundario:
    "inline-flex flex-1 items-center justify-center rounded-2xl border border-line bg-white px-5 py-3.5 text-base font-semibold text-ink-soft transition-colors hover:border-ink/40",
};

export function Tarjeta({
  etiqueta,
  titulo,
  detalle,
  children,
  tono = "neutro",
}: {
  etiqueta: string;
  titulo: ReactNode;
  detalle?: ReactNode;
  children?: ReactNode;
  tono?: "neutro" | "cita" | "diseno" | "dinero";
}) {
  const borde = {
    neutro: "border-l-line",
    cita: "border-l-orchid",
    diseno: "border-l-moss",
    dinero: "border-l-amber",
  }[tono];

  return (
    <article className={`rounded-2xl border border-line border-l-4 ${borde} bg-white p-5 sm:p-6`}>
      <p className="text-[0.875rem] font-semibold text-muted">{etiqueta}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-[1.375rem] leading-snug text-ink">{titulo}</p>
      {detalle ? <div className="mt-1.5 text-[1rem] leading-relaxed text-ink-soft">{detalle}</div> : null}
      {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
    </article>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-[0.9375rem] font-semibold text-muted">{titulo}</h2>
      {children}
    </section>
  );
}

export function Encabezado({ titulo, bajada, volver }: { titulo: string; bajada?: string; volver?: { href: string; label: string } }) {
  return (
    <header className="mb-6">
      {volver ? (
        <Link href={volver.href} className="mb-3 inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-muted hover:text-ink">
          ← {volver.label}
        </Link>
      ) : null}
      <h1 className="font-[family-name:var(--font-display)] text-[2rem] leading-tight text-ink">{titulo}</h1>
      {bajada ? <p className="mt-1 text-[1rem] text-ink-soft">{bajada}</p> : null}
    </header>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-[family-name:var(--font-display)] text-[1.375rem] text-ink">{titulo}</p>
      {texto ? <p className="mx-auto mt-2 max-w-md text-[1rem] text-ink-soft">{texto}</p> : null}
    </div>
  );
}

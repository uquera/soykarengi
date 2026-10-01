"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Error inesperado en cualquier página: un mensaje en español y una salida. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="eyebrow text-muted">Algo salió mal</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">No pudimos mostrar esta página</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Fue un error nuestro, no tuyo. Prueba otra vez en un momento; si sigue pasando, escríbenos desde Contacto.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-muted">Código: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream hover:bg-ink-soft"
        >
          Intentar de nuevo
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink-soft hover:border-ink/40">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}

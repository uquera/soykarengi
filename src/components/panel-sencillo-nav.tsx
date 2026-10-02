"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Pestana = { href: string; label: string; icono: string; badge?: number };

const ICONOS: Record<string, string> = {
  hoy: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  agenda: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  clientas:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  mensajes: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
};

function Icono({ nombre }: { nombre: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d={ICONOS[nombre]} />
    </svg>
  );
}

/**
 * Las cuatro secciones del panel sencillo. En el teléfono van fijas abajo,
 * como en una app; en el computador, arriba. Botones grandes y con nombre.
 */
export function PanelSencilloNav({ pestanas }: { pestanas: Pestana[] }) {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/panel" ? ruta === "/panel" : ruta.startsWith(href));

  const enlaces = (movil: boolean) =>
    pestanas.map((p) => (
      <Link
        key={p.href}
        href={p.href}
        aria-current={activa(p.href) ? "page" : undefined}
        className={
          movil
            ? `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.8125rem] font-semibold ${
                activa(p.href) ? "text-ink" : "text-muted"
              }`
            : `relative flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-colors ${
                activa(p.href) ? "bg-ink text-cream" : "text-ink-soft hover:bg-shell"
              }`
        }
      >
        <Icono nombre={p.icono} />
        {p.label}
        {p.badge ? (
          <span
            className={`grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[0.6875rem] font-bold text-white ${
              movil ? "absolute top-1 left-1/2 ml-2" : ""
            }`}
          >
            {p.badge}
          </span>
        ) : null}
      </Link>
    ));

  return (
    <>
      <nav aria-label="Secciones" className="mb-8 hidden gap-2 rounded-full border border-line bg-white p-1.5 md:flex">
        {enlaces(false)}
      </nav>
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {enlaces(true)}
      </nav>
    </>
  );
}

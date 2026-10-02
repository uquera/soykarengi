import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PanelSencilloNav } from "@/components/panel-sencillo-nav";
import { contarPendientes } from "./pendientes";

export const dynamic = "force-dynamic";

/**
 * Panel sencillo de Karen: en vez de 14 secciones, cuatro. Letra y botones
 * más grandes, una sola columna, y siempre a la vista cuántas cosas esperan.
 */
export default async function PanelSencilloLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [pendientes, mensajes] = await Promise.all([
    contarPendientes(),
    db.contactMessage.count({ where: { handled: false } }),
  ]);

  return (
    <div className="shell max-w-3xl pt-6 pb-28 text-[1.0625rem] md:pb-16">
      <div className="mb-4 flex justify-end">
        <Link
          href="/panel/ajustes"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.9375rem] font-semibold text-muted hover:bg-shell hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
          Ajustes
        </Link>
      </div>

      <PanelSencilloNav
        pestanas={[
          { href: "/panel", label: "Hoy", icono: "hoy", badge: pendientes },
          { href: "/panel/agenda", label: "Agenda", icono: "agenda" },
          { href: "/panel/clientas", label: "Clientas", icono: "clientas" },
          { href: "/panel/mensajes", label: "Mensajes", icono: "mensajes", badge: mensajes },
        ]}
      />

      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

type Clienta = { id: string; nombre: string; contacto: string; citas: number; pedidos: number };

/** Sin tildes ni mayúsculas: «maria» encuentra a «María». */
const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function BuscadorClientas({ clientas }: { clientas: Clienta[] }) {
  const [busqueda, setBusqueda] = useState("");
  const q = normalizar(busqueda.trim());
  const visibles = q ? clientas.filter((c) => normalizar(`${c.nombre} ${c.contacto}`).includes(q)) : clientas;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre…"
        aria-label="Buscar clienta"
        className="w-full rounded-2xl border border-line bg-white px-5 py-4 text-[1.0625rem]"
      />
      {visibles.length === 0 ? (
        <p className="px-1 text-ink-soft">No encontramos a nadie con «{busqueda}».</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {visibles.map((c) => (
            <li key={c.id}>
              <Link href={`/panel/clientas/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-shell/50">
                <span className="min-w-0">
                  <span className="block truncate text-[1.0625rem] font-semibold text-ink">{c.nombre}</span>
                  <span className="block truncate text-[0.9375rem] text-muted">{c.contacto}</span>
                </span>
                <span className="shrink-0 text-right text-[0.875rem] text-muted">
                  {c.citas > 0 ? `${c.citas} ${c.citas === 1 ? "cita" : "citas"}` : ""}
                  {c.citas > 0 && c.pedidos > 0 ? <br /> : null}
                  {c.pedidos > 0 ? `${c.pedidos} ${c.pedidos === 1 ? "pedido" : "pedidos"}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

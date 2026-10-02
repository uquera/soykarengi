"use client";

import { useState } from "react";
import { guardarPreciosAction } from "@/lib/actions/panel";
import { useAccionSinReset } from "@/components/use-accion-sin-reset";
import { BTN } from "@/components/panel-sencillo-ui";

type Servicio = { id: string; nombre: string; precio: number; aConvenir: boolean };

export function PreciosForm({ servicios }: { servicios: Servicio[] }) {
  const { state, onSubmit, pending } = useAccionSinReset(guardarPreciosAction, {});
  const [valores, setValores] = useState(servicios);

  const cambiar = (id: string, cambio: Partial<Servicio>) =>
    setValores((prev) => prev.map((s) => (s.id === id ? { ...s, ...cambio } : s)));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {valores.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <input type="hidden" name="servicio" value={s.id} />
            <span className="min-w-[10rem] flex-1 text-[1.0625rem] font-semibold text-ink">{s.nombre}</span>
            <span className={`flex items-center rounded-xl border border-line px-3 ${s.aConvenir ? "opacity-40" : ""}`}>
              <span className="text-muted">$</span>
              <input
                name={`precio-${s.id}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={s.precio}
                disabled={s.aConvenir}
                onChange={(e) => cambiar(s.id, { precio: Number(e.target.value) })}
                aria-label={`Precio de ${s.nombre}`}
                className="w-24 bg-transparent px-2 py-2.5 text-[1.0625rem] font-semibold outline-none"
              />
            </span>
            <label className="flex cursor-pointer items-center gap-2 text-[0.9375rem] text-ink-soft">
              <input
                type="checkbox"
                name={`convenir-${s.id}`}
                checked={s.aConvenir}
                onChange={(e) => cambiar(s.id, { aConvenir: e.target.checked })}
                className="h-5 w-5"
              />
              A convenir
            </label>
          </li>
        ))}
      </ul>
      <p className="px-1 text-[0.9375rem] text-muted">Con precio 0 la web muestra «Sin costo».</p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={`${BTN.principal} flex-none disabled:opacity-50`}>
          {pending ? "Guardando…" : "Guardar precios"}
        </button>
        {state.error ? <p className="font-semibold text-rose-deep">{state.error}</p> : null}
        {state.ok ? <p className="font-semibold text-moss-deep">Guardado. Ya se ven en la web.</p> : null}
      </div>
    </form>
  );
}

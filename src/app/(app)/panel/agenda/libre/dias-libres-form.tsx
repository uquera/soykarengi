"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { diasLibresAction } from "@/lib/actions/panel";
import { FormAccion } from "@/components/form-accion";
import { BTN } from "@/components/panel-sencillo-ui";

const campo = "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[1.0625rem]";

export function DiasLibresForm({ hoy }: { hoy: string }) {
  const router = useRouter();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  return (
    <FormAccion
      action={async (fd) => {
        const r = await diasLibresAction(fd);
        if (!r?.error) router.push("/panel/agenda");
        return r;
      }}
      className="space-y-5 rounded-2xl border border-line bg-white p-6"
    >
      <label className="block">
        <span className="text-[1rem] font-semibold text-ink">Desde el día</span>
        <input type="date" name="desde" min={hoy} required value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} />
      </label>
      <label className="block">
        <span className="text-[1rem] font-semibold text-ink">Hasta el día</span>
        <span className="block text-[0.875rem] text-muted">Si es un solo día, déjalo vacío.</span>
        <input type="date" name="hasta" min={desde || hoy} value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} />
      </label>
      <label className="block">
        <span className="text-[1rem] font-semibold text-ink">Motivo (solo lo ves tú)</span>
        <input name="motivo" placeholder="Vacaciones, viaje, personal…" className={campo} />
      </label>
      <button type="submit" className={BTN.principal}>
        Guardar días libres
      </button>
    </FormAccion>
  );
}

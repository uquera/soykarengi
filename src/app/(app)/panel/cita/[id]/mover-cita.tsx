"use client";

import { useEffect, useState } from "react";
import { moverCitaAction } from "@/lib/actions/panel";
import { FormAccion } from "@/components/form-accion";
import { BTN } from "@/components/panel-sencillo-ui";

/** Elegir día y hora libres para mover una cita: dos pasos, sin calendario. */
export function MoverCita({ id, servicioId, minimo }: { id: string; servicioId: string; minimo: string }) {
  const [abierto, setAbierto] = useState(false);
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState<number | null>(null);
  const [horas, setHoras] = useState<{ hour: number; label: string }[] | null>(null);

  useEffect(() => {
    if (!dia) return;
    let cancelado = false;
    fetch(`/api/agenda/slots?dia=${dia}&servicio=${servicioId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado) setHoras(d.slots ?? []);
      })
      .catch(() => {
        if (!cancelado) setHoras([]);
      });
    return () => {
      cancelado = true;
    };
  }, [dia, servicioId]);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className={BTN.secundario}>
        Cambiar fecha
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-shell/50 p-5">
      <p className="text-[1rem] font-semibold text-ink">1. Elige el día nuevo</p>
      <input
        type="date"
        min={minimo}
        value={dia}
        onChange={(e) => {
          setDia(e.target.value);
          setHora(null);
          setHoras(null);
        }}
        className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[1.0625rem]"
      />

      {dia ? (
        <>
          <p className="mt-5 text-[1rem] font-semibold text-ink">2. Elige la hora</p>
          {horas === null ? (
            <p className="mt-2 text-muted">Buscando horas libres…</p>
          ) : horas.length === 0 ? (
            <p className="mt-2 text-ink-soft">Ese día no tienes horas libres. Prueba con otro.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {horas.map((h) => (
                <button
                  key={h.hour}
                  type="button"
                  aria-pressed={hora === h.hour}
                  onClick={() => setHora(h.hour)}
                  className={`rounded-xl border px-5 py-3 text-[1.0625rem] font-semibold ${
                    hora === h.hour ? "border-ink bg-ink text-cream" : "border-line bg-white"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}

      <FormAccion action={moverCitaAction} className="mt-5 flex flex-wrap gap-3" okMensaje="Listo. Le avisamos por correo.">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dia" value={dia} />
        <input type="hidden" name="hora" value={hora ?? ""} />
        <button type="submit" disabled={!dia || hora === null} className={`${BTN.principal} disabled:opacity-40`}>
          Mover la cita
        </button>
        <button type="button" onClick={() => setAbierto(false)} className={BTN.secundario}>
          No cambiar
        </button>
      </FormAccion>
    </div>
  );
}

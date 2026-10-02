"use client";

import { useEffect, useState } from "react";
import { agendarSencilloAction } from "@/lib/actions/panel";
import { FormAccion } from "@/components/form-accion";
import { BTN } from "@/components/panel-sencillo-ui";

type Servicio = { id: string; nombre: string; modalidad: string; minutos: number };

const campo = "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[1.0625rem]";
const paso = "text-[1.0625rem] font-semibold text-ink";

/** Agendar en cuatro pasos visibles: servicio, día, hora y datos. */
export function AgendarForm({ servicios, hoy }: { servicios: Servicio[]; hoy: string }) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState<number | null>(null);
  const [horas, setHoras] = useState<{ hour: number; label: string }[] | null>(null);
  const [modalidad, setModalidad] = useState("Online");

  const servicio = servicios.find((s) => s.id === servicioId);
  const elegirModalidad = servicio?.modalidad === "Ambas";
  const modalidadFinal = elegirModalidad ? modalidad : servicio?.modalidad === "Presencial" ? "Presencial" : "Online";

  useEffect(() => {
    if (!dia || !servicioId) return;
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

  return (
    <FormAccion action={agendarSencilloAction} className="space-y-7 rounded-2xl border border-line bg-white p-6">
      <input type="hidden" name="serviceId" value={servicioId} />
      <input type="hidden" name="dia" value={dia} />
      <input type="hidden" name="hora" value={hora ?? ""} />
      <input type="hidden" name="modality" value={modalidadFinal} />

      <div>
        <p className={paso}>1. ¿Qué tipo de sesión?</p>
        <div className="mt-2 grid gap-2">
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === servicioId}
              onClick={() => {
                setServicioId(s.id);
                setHora(null);
                setHoras(null);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-[1.0625rem] ${
                s.id === servicioId ? "border-ink bg-ink text-cream" : "border-line bg-white"
              }`}
            >
              {s.nombre} <span className="opacity-70">· {s.minutos} min</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={paso}>2. ¿Qué día?</p>
        <input
          type="date"
          min={hoy}
          value={dia}
          onChange={(e) => {
            setDia(e.target.value);
            setHora(null);
            setHoras(null);
          }}
          className={campo}
        />
      </div>

      {dia ? (
        <div>
          <p className={paso}>3. ¿A qué hora?</p>
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
        </div>
      ) : null}

      {elegirModalidad ? (
        <div>
          <p className={paso}>¿Online o presencial?</p>
          <div className="mt-2 flex gap-2">
            {["Online", "Presencial"].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modalidad === m}
                onClick={() => setModalidad(m)}
                className={`flex-1 rounded-xl border px-4 py-3 text-[1.0625rem] ${
                  modalidad === m ? "border-ink bg-ink text-cream" : "border-line bg-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <p className={paso}>4. ¿Con quién?</p>
        <label className="block">
          <span className="text-[1rem] text-ink-soft">Nombre</span>
          <input name="name" required autoComplete="off" className={campo} />
        </label>
        <label className="block">
          <span className="text-[1rem] text-ink-soft">Correo</span>
          <input name="email" type="email" required autoComplete="off" className={campo} />
        </label>
        <label className="block">
          <span className="text-[1rem] text-ink-soft">Teléfono (opcional)</span>
          <input name="phone" type="tel" autoComplete="off" className={campo} />
        </label>
        <label className="block">
          <span className="text-[1rem] text-ink-soft">Nota (opcional, solo la ves tú)</span>
          <input name="reason" autoComplete="off" className={campo} />
        </label>
      </div>

      <button type="submit" disabled={!dia || hora === null} className={`${BTN.principal} w-full disabled:opacity-40`}>
        Agendar y confirmar
      </button>
    </FormAccion>
  );
}

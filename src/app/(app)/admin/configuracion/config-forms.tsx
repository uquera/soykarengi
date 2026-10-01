"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  guardarContactoAction,
  guardarHorarioAction,
  guardarPoliticasAction,
  type ConfigState,
} from "@/lib/actions/config";
import { Field, inputClass } from "@/components/ui";

function Guardar({ label = "Guardar cambios" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-6 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

function Estado({ state }: { state: ConfigState }) {
  if (state.error) return <p className="text-[0.8125rem] font-semibold text-rose-deep">{state.error}</p>;
  if (state.ok) return <p className="text-[0.8125rem] font-semibold text-moss-deep">Guardado.</p>;
  return null;
}

/* Los campos son controlados a propósito: React 19 reinicia los formularios no
   controlados después de cada envío, y un error borraría lo que Karen escribió. */

export function ContactoForm({
  inicial,
}: {
  inicial: { contactoEmail: string; whatsapp: string; instagram: string; direccion: string };
}) {
  const [state, action] = useActionState(guardarContactoAction, {});
  const [v, setV] = useState(inicial);
  const campo = (k: keyof typeof v) => ({
    name: k,
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }),
    className: inputClass,
  });

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Correo de contacto" hint="Se muestra en la web y en los correos automáticos.">
          <input type="email" placeholder="soykarengi@gmail.com" {...campo("contactoEmail")} />
        </Field>
        <Field label="WhatsApp" hint="Con código de país, por ejemplo +1 786 555 0000.">
          <input type="tel" placeholder="+1 …" {...campo("whatsapp")} />
        </Field>
        <Field label="Instagram" hint="Solo el usuario, sin la @.">
          <input placeholder="soykarengi" {...campo("instagram")} />
        </Field>
        <Field label="Dirección de la consulta presencial" hint="Déjala vacía si atiendes solo online.">
          <input placeholder="Calle, ciudad" {...campo("direccion")} />
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <Guardar />
        <Estado state={state} />
      </div>
    </form>
  );
}

const DIAS = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

export function HorarioForm({ inicial, horas }: { inicial: number[][]; horas: number[] }) {
  const [state, action] = useActionState(guardarHorarioAction, {});
  const [semana, setSemana] = useState(inicial);

  const alternar = (dia: number, h: number) =>
    setSemana((prev) =>
      prev.map((lista, d) =>
        d !== dia ? lista : lista.includes(h) ? lista.filter((x) => x !== h) : [...lista, h].sort((a, b) => a - b),
      ),
    );

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-3">
        {DIAS.map(({ dia, nombre }) => {
          const abiertas = semana[dia] ?? [];
          return (
            <div key={dia} className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
              <div className="flex items-center justify-between sm:block">
                <p className="text-sm font-semibold">{nombre}</p>
                <p className="text-[0.75rem] text-muted">
                  {abiertas.length === 0 ? "Cerrado" : `${abiertas.length} bloque${abiertas.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {horas.map((h) => {
                  const on = abiertas.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={on}
                      onClick={() => alternar(dia, h)}
                      className={`w-14 rounded-lg border py-1.5 text-[0.75rem] font-semibold transition-colors ${
                        on ? "border-orchid-deep bg-orchid-deep text-cream" : "border-line bg-white text-muted hover:border-orchid/50"
                      }`}
                    >
                      {String(h).padStart(2, "0")}:00
                    </button>
                  );
                })}
              </div>
              {abiertas.map((h) => (
                <input key={h} type="hidden" name={`dia-${dia}`} value={h} />
              ))}
            </div>
          );
        })}
      </div>
      <p className="text-[0.8125rem] text-muted">
        Cada casilla es la hora en que puede empezar una sesión. Las citas ya agendadas no se mueven al cambiar el
        horario; para tomarte días libres usa «Bloquear horario» en la agenda.
      </p>
      <div className="flex items-center gap-4">
        <Guardar label="Guardar horario" />
        <Estado state={state} />
      </div>
    </form>
  );
}

export function PoliticasForm({
  inicial,
  porDefecto,
}: {
  inicial: { cancelacionHoras: number; cancelacionTexto: string; instruccionesPago: string; avisoCrisis: string };
  porDefecto: { cancelacionTexto: string; avisoCrisis: string };
}) {
  const [state, action] = useActionState(guardarPoliticasAction, {});
  const [v, setV] = useState(inicial);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <Field label="Cancelar con al menos" hint="Horas de anticipación.">
          <input
            type="number"
            name="cancelacionHoras"
            min={0}
            max={168}
            value={v.cancelacionHoras}
            onChange={(e) => setV({ ...v, cancelacionHoras: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field
          label="Política de cancelación"
          hint="Se muestra al reservar y en Mis citas. Vacía = el texto por defecto."
        >
          <textarea
            name="cancelacionTexto"
            rows={3}
            value={v.cancelacionTexto}
            placeholder={porDefecto.cancelacionTexto}
            onChange={(e) => setV({ ...v, cancelacionTexto: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Instrucciones de pago"
        hint="Zelle, transferencia, PayPal… Se le muestran a la clienta cuando aprueba una cotización o reserva una sesión."
      >
        <textarea
          name="instruccionesPago"
          rows={4}
          value={v.instruccionesPago}
          placeholder="Zelle a … a nombre de … · Indica tu código de reserva en el concepto."
          onChange={(e) => setV({ ...v, instruccionesPago: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field
        label="Aviso de crisis"
        hint="Se muestra en la agenda, en contacto y en Mis citas. Vacío = el aviso por defecto (911 y 988)."
      >
        <textarea
          name="avisoCrisis"
          rows={3}
          value={v.avisoCrisis}
          placeholder={porDefecto.avisoCrisis}
          onChange={(e) => setV({ ...v, avisoCrisis: e.target.value })}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-4">
        <Guardar />
        <Estado state={state} />
      </div>
    </form>
  );
}

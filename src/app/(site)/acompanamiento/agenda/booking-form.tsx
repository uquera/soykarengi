"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAppointmentAction } from "@/lib/actions/booking";
import { Field, inputClass } from "@/components/ui";
import { duration, type FmtLocale } from "@/lib/format";

type Service = {
  id: string;
  name: string;
  modality: string;
  modalityLabel: string;
  durationMin: number;
  priceLabel: string;
  accentEmoji: string;
};

type Day = { iso: string; label: string; weekday: string; open: boolean };

export type BookingCopy = {
  step: string;
  stepService: string;
  stepWhen: string;
  stepBefore: string;
  beforeLead: string;
  modality: string;
  modalityOptions: { value: string; label: string }[];
  firstTimeQ: string;
  firstTimeYes: string;
  firstTimeNo: string;
  reasonLabel: string;
  reasonHint: string;
  reasonPlaceholder: string;
  loadingSlots: string;
  noSlots: string;
  summaryService: string;
  summaryWhen: string;
  summaryPending: string;
  summaryValue: string;
  confirm: string;
  sending: string;
  confirmNote: string;
  pickHour: string;
  consentTitle: string;
  consentLead: string;
  consentAccept: string;
  consentRead: string;
  policyTitle: string;
};

function Submit({ label, pendingLabel, disabled }: { label: string; pendingLabel: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center rounded-full bg-orchid-deep px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-orchid disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/*
 * Todos los campos son controlados. React 19 reinicia los formularios no
 * controlados después de cada envío: con un error (horario tomado, falta el
 * consentimiento) la persona perdía lo que había escrito sobre lo que le pasa.
 */
export function BookingForm({
  services,
  days,
  initialServiceId,
  locale,
  copy,
  consentimiento,
  politica,
}: {
  services: Service[];
  days: Day[];
  initialServiceId: string;
  locale: FmtLocale;
  copy: BookingCopy;
  /** La versión vigente si todavía no la aceptó; null si ya está aceptada. */
  consentimiento: { id: string; version: number } | null;
  politica: string;
}) {
  const [state, action] = useActionState(createAppointmentAction, {});

  const [serviceId, setServiceId] = useState(initialServiceId || services[0]?.id || "");
  const [day, setDay] = useState(days.find((d) => d.open)?.iso ?? "");
  const [hour, setHour] = useState<number | null>(null);
  const [slots, setSlots] = useState<{ hour: number; label: string }[] | null>(null);
  const [modality, setModality] = useState("");
  const [firstTime, setFirstTime] = useState("si");
  const [reason, setReason] = useState("");
  const [acepta, setAcepta] = useState(false);

  const service = services.find((s) => s.id === serviceId);

  // "Ambas" deja elegir; si el servicio es solo online o solo presencial, no hay nada que decidir.
  const modalities = copy.modalityOptions.filter(
    (m) => !service || service.modality === "Ambas" || service.modality === m.value,
  );
  const modalidadElegida = modalities.some((m) => m.value === modality) ? modality : (modalities[0]?.value ?? "");

  // Los bloques libres dependen del día y de cuánto dura el servicio.
  // Al cambiar de día o de servicio la hora elegida deja de valer.
  function elegirDia(iso: string) {
    setDay(iso);
    setSlots(null);
    setHour(null);
  }
  function elegirServicio(id: string) {
    setServiceId(id);
    setSlots(null);
    setHour(null);
  }

  useEffect(() => {
    if (!day) return;
    let cancelled = false;

    fetch(`/api/agenda/slots?dia=${day}&servicio=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });

    return () => {
      cancelled = true;
    };
  }, [day, serviceId]);

  const listo = hour !== null && (!consentimiento || acepta);

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="hour" value={hour ?? ""} />
      <input type="hidden" name="modality" value={modalidadElegida} />
      <input type="hidden" name="firstTime" value={firstTime} />
      {consentimiento && acepta ? <input type="hidden" name="aceptaConsentimiento" value={consentimiento.id} /> : null}

      <section>
        <p className="eyebrow text-orchid-deep">{copy.step} 01</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{copy.stepService}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const active = s.id === serviceId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => elegirServicio(s.id)}
                className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                  active ? "border-orchid bg-orchid-soft" : "border-line bg-white hover:border-orchid/40"
                }`}
              >
                <span className="text-lg">{s.accentEmoji}</span>
                <p className="mt-2 font-semibold">{s.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {duration(s.durationMin, locale)} · {s.modalityLabel} · {s.priceLabel}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="eyebrow text-orchid-deep">{copy.step} 02</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{copy.stepWhen}</h2>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const active = d.iso === day;
            return (
              <button
                key={d.iso}
                type="button"
                disabled={!d.open}
                aria-pressed={active}
                onClick={() => elegirDia(d.iso)}
                className={`min-w-[4.5rem] shrink-0 rounded-2xl border px-3 py-3 text-center transition-colors ${
                  active
                    ? "border-orchid bg-orchid text-white"
                    : d.open
                      ? "border-line bg-white hover:border-orchid/40"
                      : "border-line/60 bg-shell/50 text-muted/50"
                }`}
              >
                <span className="block text-[0.625rem] tracking-wide uppercase opacity-80">{d.weekday}</span>
                <span className="mt-1 block text-sm font-semibold">{d.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5" aria-live="polite">
          {slots === null ? (
            <p className="text-sm text-muted">{copy.loadingSlots}</p>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-line bg-shell/60 px-4 py-3 text-sm text-ink-soft">{copy.noSlots}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.hour}
                  type="button"
                  aria-pressed={hour === s.hour}
                  onClick={() => setHour(s.hour)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    hour === s.hour ? "border-orchid bg-orchid text-white" : "border-line bg-white hover:border-orchid/40"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <p className="eyebrow text-orchid-deep">{copy.step} 03</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{copy.stepBefore}</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">{copy.beforeLead}</p>

        <div className="mt-5 space-y-5">
          {modalities.length > 1 ? (
            <fieldset>
              <legend className="mb-1.5 block text-sm font-semibold text-ink">{copy.modality}</legend>
              <div className="flex gap-2">
                {modalities.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={modalidadElegida === m.value}
                    onClick={() => setModality(m.value)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      modalidadElegida === m.value ? "border-orchid bg-orchid-soft" : "border-line bg-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold text-ink">{copy.firstTimeQ}</legend>
            <div className="flex gap-2">
              {(
                [
                  ["si", copy.firstTimeYes],
                  ["no", copy.firstTimeNo],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={firstTime === value}
                  onClick={() => setFirstTime(value)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    firstTime === value ? "border-orchid bg-orchid-soft" : "border-line bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <Field label={copy.reasonLabel} hint={copy.reasonHint}>
            <textarea
              name="reason"
              rows={5}
              required
              minLength={15}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              placeholder={copy.reasonPlaceholder}
            />
          </Field>
        </div>
      </section>

      {consentimiento ? (
        <section className="rounded-2xl border border-orchid/30 bg-orchid-soft/50 p-6">
          <p className="eyebrow text-orchid-deep">{copy.consentTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{copy.consentLead}</p>
          <a
            href="/consentimiento"
            target="_blank"
            rel="noopener"
            className="mt-3 inline-block text-sm font-semibold text-orchid-deep underline underline-offset-2"
          >
            {copy.consentRead} →
          </a>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#6B4A68]"
            />
            <span>
              {copy.consentAccept} (v{consentimiento.version})
            </span>
          </label>
        </section>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <div className="card-soft space-y-4 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{copy.summaryService}</span>
          <span className="font-semibold">{service?.name ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{copy.summaryWhen}</span>
          <span className="font-semibold">
            {day && hour !== null
              ? `${days.find((d) => d.iso === day)?.label} · ${String(hour).padStart(2, "0")}:00`
              : copy.summaryPending}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">{copy.summaryValue}</span>
          <span className="font-[family-name:var(--font-display)] text-2xl">{service?.priceLabel ?? "—"}</span>
        </div>
        <Submit label={copy.confirm} pendingLabel={copy.sending} disabled={!listo} />
        {hour === null ? <p className="text-center text-xs text-muted">{copy.pickHour}</p> : null}
        <p className="text-center text-xs text-muted">{copy.confirmNote}</p>
        <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink-soft">{copy.policyTitle}.</span> {politica}
        </p>
      </div>
    </form>
  );
}

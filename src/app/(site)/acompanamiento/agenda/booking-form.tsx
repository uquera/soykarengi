"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAppointmentAction } from "@/lib/actions/booking";
import { Field, inputClass } from "@/components/ui";
import { money, duration, type FmtLocale } from "@/lib/format";

type Service = {
  id: string;
  name: string;
  modality: string;
  modalityLabel: string;
  durationMin: number;
  price: number;
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
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-orchid-deep px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-orchid disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function BookingForm({
  services,
  days,
  initialServiceId,
  locale,
  copy,
}: {
  services: Service[];
  days: Day[];
  initialServiceId: string;
  locale: FmtLocale;
  copy: BookingCopy;
}) {
  const [state, action] = useActionState(createAppointmentAction, {});

  const [serviceId, setServiceId] = useState(initialServiceId || services[0]?.id || "");
  const [day, setDay] = useState(days.find((d) => d.open)?.iso ?? "");
  const [hour, setHour] = useState<number | null>(null);
  const [slots, setSlots] = useState<{ hour: number; label: string }[] | null>(null);

  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setSlots(null);
    setHour(null);

    fetch(`/api/agenda/slots?dia=${day}`)
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
  }, [day]);

  // "Ambas" deja elegir; si el servicio es sólo online o sólo presencial, no hay nada que decidir.
  const modalities = copy.modalityOptions.filter(
    (m) => !service || service.modality === "Ambas" || service.modality === m.value,
  );

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="hour" value={hour ?? ""} />

      <section>
        <p className="eyebrow text-orchid-deep">
          {copy.step} 01
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{copy.stepService}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const active = s.id === serviceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                  active ? "border-orchid bg-orchid-soft" : "border-line bg-white hover:border-orchid/40"
                }`}
              >
                <span className="text-lg">{s.accentEmoji}</span>
                <p className="mt-2 font-semibold">{s.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {duration(s.durationMin, locale)} · {money(s.price, locale)}
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
                onClick={() => setDay(d.iso)}
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

        <div className="mt-5">
          {slots === null ? (
            <p className="text-sm text-muted">{copy.loadingSlots}</p>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-line bg-shell/60 px-4 py-3 text-sm text-ink-soft">
              {copy.noSlots}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.hour}
                  type="button"
                  onClick={() => setHour(s.hour)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    hour === s.hour
                      ? "border-orchid bg-orchid text-white"
                      : "border-line bg-white hover:border-orchid/40"
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
          <Field label={copy.modality}>
            <div className="flex gap-2">
              {modalities.map((m, i) => (
                <label
                  key={m.value}
                  className="flex-1 cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-sm has-checked:border-orchid has-checked:bg-orchid-soft"
                >
                  <input
                    type="radio"
                    name="modality"
                    value={m.value}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label={copy.firstTimeQ}>
            <div className="flex gap-2">
              {[
                ["si", copy.firstTimeYes],
                ["no", copy.firstTimeNo],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex-1 cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-sm has-checked:border-orchid has-checked:bg-orchid-soft"
                >
                  <input
                    type="radio"
                    name="firstTime"
                    value={value}
                    defaultChecked={value === "si"}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>

          <Field label={copy.reasonLabel} hint={copy.reasonHint}>
            <textarea
              name="reason"
              rows={5}
              required
              minLength={15}
              className={inputClass}
              placeholder={copy.reasonPlaceholder}
            />
          </Field>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
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
          <span className="font-[family-name:var(--font-display)] text-2xl">
            {money(service?.price ?? 0, locale)}
          </span>
        </div>
        <Submit label={copy.confirm} pendingLabel={copy.sending} />
        <p className="text-center text-xs text-muted">{copy.confirmNote}</p>
      </div>
    </form>
  );
}

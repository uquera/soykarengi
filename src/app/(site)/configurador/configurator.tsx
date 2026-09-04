"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createDesignRequestAction } from "@/lib/actions/designs";
import { EMOTIONS, FORMATS, PURPOSES } from "@/lib/domain";
import { Field, inputClass } from "@/components/ui";
import { money, type FmtLocale } from "@/lib/format";

type DesignOption = { id: string; name: string; basePrice: number; categoryName: string };

export type ConfiguratorCopy = {
  steps: string[];
  q1: string;
  q1Lead: string;
  q2: string;
  q2Lead: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  baseLabel: string;
  baseHint: string;
  baseNone: string;
  from: string;
  q3: string;
  q3Lead: string;
  q4: string;
  q4Lead: string;
  dateLabel: string;
  optional: string;
  quantityLabel: string;
  formatLabel: string;
  detailsLabel: string;
  detailsHint: string;
  detailsPlaceholder: string;
  filesLabel: string;
  filesHint: string;
  q5: string;
  q5Lead: string;
  ideaPlaceholder: string;
  chars: string;
  summary: string;
  sumWhat: string;
  sumWho: string;
  sumFeel: string;
  sumBase: string;
  sumFromScratch: string;
  submit: string;
  sending: string;
  submitNote: string;
  back: string;
  next: string;
  lastStep: string;
  purposeHints: Record<string, string>;
  purposeLabels: Record<string, string>;
  emotionLabels: Record<string, string>;
  formatLabels: Record<string, string>;
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-moss-deep px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-moss-deep/85 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Configurator({
  designs,
  initialDesignId,
  locale,
  copy,
}: {
  designs: DesignOption[];
  initialDesignId: string;
  locale: FmtLocale;
  copy: ConfiguratorCopy;
}) {
  const [state, action] = useActionState(createDesignRequestAction, {});

  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [designId, setDesignId] = useState(initialDesignId);

  const canAdvance = [
    purpose !== "",
    recipient.trim().length >= 2,
    emotions.length > 0,
    true,
    idea.trim().length >= 20,
  ];

  const toggleEmotion = (e: string) =>
    setEmotions((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  return (
    <form action={action}>
      {/* Progreso */}
      <ol className="mb-10 flex flex-wrap gap-1.5">
        {copy.steps.map((label, i) => (
          <li key={label} className="flex-1">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`w-full rounded-full px-3 py-2 text-left text-[0.6875rem] font-semibold tracking-wide transition-colors ${
                i === step ? "bg-moss-deep text-cream" : i < step ? "bg-moss-soft text-moss-deep" : "bg-shell text-muted"
              }`}
            >
              <span className="opacity-70">0{i + 1}</span> {label}
            </button>
          </li>
        ))}
      </ol>

      {/* Paso 1 */}
      <section className={step === 0 ? "block" : "hidden"}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">{copy.q1}</h2>
        <p className="mt-2 text-ink-soft">{copy.q1Lead}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {PURPOSES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPurpose(p.key)}
              className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                purpose === p.key ? "border-moss-deep bg-moss-soft" : "border-line bg-white hover:border-moss/70"
              }`}
            >
              <p className="font-semibold">{copy.purposeLabels[p.key] ?? p.key}</p>
              <p className="mt-1 text-[0.8125rem] text-ink-soft">{copy.purposeHints[p.key] ?? p.hint}</p>
            </button>
          ))}
        </div>
        <input type="hidden" name="purpose" value={purpose} />
      </section>

      {/* Paso 2 */}
      <section className={step === 1 ? "block" : "hidden"}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">{copy.q2}</h2>
        <p className="mt-2 text-ink-soft">{copy.q2Lead}</p>

        <div className="mt-7 space-y-5">
          <Field label={copy.recipientLabel}>
            <input
              name="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={inputClass}
              placeholder={copy.recipientPlaceholder}
            />
          </Field>

          <Field label={copy.baseLabel} hint={copy.baseHint}>
            <select
              name="designId"
              value={designId}
              onChange={(e) => setDesignId(e.target.value)}
              className={inputClass}
            >
              <option value="">{copy.baseNone}</option>
              {designs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.categoryName} · {copy.from} {money(d.basePrice, locale)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Paso 3 */}
      <section className={step === 2 ? "block" : "hidden"}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">{copy.q3}</h2>
        <p className="mt-2 text-ink-soft">{copy.q3Lead}</p>

        <div className="mt-7 flex flex-wrap gap-2.5">
          {EMOTIONS.map((e) => {
            const active = emotions.includes(e);
            return (
              <button
                key={e}
                type="button"
                onClick={() => toggleEmotion(e)}
                className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  active ? "border-moss-deep bg-moss-deep text-cream" : "border-line bg-white hover:border-moss/70"
                }`}
              >
                {copy.emotionLabels[e] ?? e}
              </button>
            );
          })}
        </div>
        {emotions.map((e) => (
          <input key={e} type="hidden" name="emotions" value={e} />
        ))}
      </section>

      {/* Paso 4 */}
      <section className={step === 3 ? "block" : "hidden"}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">{copy.q4}</h2>
        <p className="mt-2 text-ink-soft">{copy.q4Lead}</p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label={copy.dateLabel} hint={copy.optional}>
            <input type="date" name="eventDate" className={inputClass} />
          </Field>

          <Field label={copy.quantityLabel}>
            <input type="number" name="quantity" defaultValue={1} min={1} max={999} className={inputClass} />
          </Field>

          <div className="sm:col-span-2">
            <Field label={copy.formatLabel}>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <label
                    key={f}
                    className="flex-1 cursor-pointer rounded-xl border border-line bg-white px-4 py-3 text-center text-sm has-checked:border-moss-deep has-checked:bg-moss-soft"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      defaultChecked={f === "Digital"}
                      className="sr-only"
                    />
                    {copy.formatLabels[f] ?? f}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={copy.detailsLabel} hint={copy.detailsHint}>
              <textarea name="details" rows={4} className={inputClass} placeholder={copy.detailsPlaceholder} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={copy.filesLabel} hint={copy.filesHint}>
              <textarea
                name="files"
                rows={3}
                className={inputClass}
                placeholder={"foto-mama-1990.jpg\nreferencia-pinterest.png"}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Paso 5 */}
      <section className={step === 4 ? "block" : "hidden"}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl">{copy.q5}</h2>
        <p className="mt-2 text-ink-soft">{copy.q5Lead}</p>

        <div className="mt-7">
          <textarea
            name="idea"
            rows={8}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className={inputClass}
            placeholder={copy.ideaPlaceholder}
          />
          <p className="mt-2 text-xs text-muted">
            {idea.trim().length} {copy.chars}
          </p>
        </div>

        {state.error ? (
          <p className="mt-5 rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
            {state.error}
          </p>
        ) : null}

        <div className="card-soft mt-8 p-6">
          <p className="eyebrow text-muted">{copy.summary}</p>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{copy.sumWhat}</dt>
              <dd className="text-right font-semibold">{copy.purposeLabels[purpose] ?? purpose ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{copy.sumWho}</dt>
              <dd className="text-right font-semibold">{recipient || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{copy.sumFeel}</dt>
              <dd className="text-right font-semibold">
                {emotions.map((e) => copy.emotionLabels[e] ?? e).join(" · ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{copy.sumBase}</dt>
              <dd className="text-right font-semibold">
                {designs.find((d) => d.id === designId)?.name ?? copy.sumFromScratch}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <Submit label={copy.submit} pendingLabel={copy.sending} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{copy.submitNote}</p>
        </div>
      </section>

      {/* Navegación */}
      <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink/40 disabled:opacity-40"
        >
          {copy.back}
        </button>

        {step < copy.steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(copy.steps.length - 1, s + 1))}
            disabled={!canAdvance[step]}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-40"
          >
            {copy.next}
          </button>
        ) : (
          <span className="text-xs text-muted">{copy.lastStep}</span>
        )}
      </div>
    </form>
  );
}

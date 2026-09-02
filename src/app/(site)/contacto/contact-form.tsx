"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactAction } from "@/lib/actions/contact";
import { Field, inputClass } from "@/components/ui";

export type ContactCopy = {
  name: string;
  namePlaceholder: string;
  email: string;
  phone: string;
  optional: string;
  about: string;
  unitSupport: string;
  unitDesigns: string;
  unitGeneral: string;
  message: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  sentTitle: string;
  sentLead: string;
  phonePlaceholder: string;
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ContactForm({ copy }: { copy: ContactCopy }) {
  const [state, action] = useActionState(sendContactAction, {});

  if (state.ok) {
    return (
      <div className="card-soft px-8 py-14 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl">{copy.sentTitle}</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{copy.sentLead}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card-soft space-y-5 p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.name}>
          <input name="name" required className={inputClass} placeholder={copy.namePlaceholder} />
        </Field>
        <Field label={copy.email}>
          <input name="email" type="email" required className={inputClass} placeholder="tu@correo.com" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.phone} hint={copy.optional}>
          <input name="phone" className={inputClass} placeholder={copy.phonePlaceholder} />
        </Field>
        <Field label={copy.about}>
          <select name="unit" defaultValue="General" className={inputClass}>
            <option value="Acompañamiento">{copy.unitSupport}</option>
            <option value="Diseños">{copy.unitDesigns}</option>
            <option value="General">{copy.unitGeneral}</option>
          </select>
        </Field>
      </div>

      <Field label={copy.message}>
        <textarea
          name="message"
          rows={6}
          required
          className={inputClass}
          placeholder={copy.messagePlaceholder}
        />
      </Field>

      {state.error ? (
        <p className="rounded-xl border border-clay/40 bg-clay-soft px-4 py-3 text-sm text-clay-deep">
          {state.error}
        </p>
      ) : null}

      <Submit label={copy.send} pendingLabel={copy.sending} />
    </form>
  );
}

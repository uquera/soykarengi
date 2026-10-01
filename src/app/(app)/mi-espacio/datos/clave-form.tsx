"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cambiarClaveAction } from "@/lib/actions/auth";
import { Field } from "@/components/ui";
import { PasswordInput, type PasswordCopy } from "@/components/password-input";

function Guardar({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ClaveForm({
  copy,
}: {
  copy: {
    title: string;
    actual: string;
    nueva: string;
    confirmar: string;
    hint: string;
    save: string;
    saving: string;
    saved: string;
    toggle: PasswordCopy;
  };
}) {
  const [state, action] = useActionState(cambiarClaveAction, {});
  const form = useRef<HTMLFormElement>(null);

  // Las contraseñas no se dejan escritas en pantalla después de cambiarlas.
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="card-soft space-y-5 p-6">
      <p className="font-semibold">{copy.title}</p>
      <Field label={copy.actual}>
        <PasswordInput name="actual" autoComplete="current-password" copy={copy.toggle} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.nueva} hint={copy.hint}>
          <PasswordInput name="nueva" autoComplete="new-password" minLength={8} copy={copy.toggle} />
        </Field>
        <Field label={copy.confirmar}>
          <PasswordInput name="confirmar" autoComplete="new-password" minLength={8} copy={copy.toggle} />
        </Field>
      </div>
      {state.error ? <p className="text-sm font-semibold text-rose-deep">{state.error}</p> : null}
      {state.ok ? <p className="text-sm font-semibold text-moss-deep">{copy.saved}</p> : null}
      <Guardar label={copy.save} pendingLabel={copy.saving} />
    </form>
  );
}

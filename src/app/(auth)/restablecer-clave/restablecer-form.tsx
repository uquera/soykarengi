"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { restablecerClaveAction } from "@/lib/actions/auth";
import { Field } from "@/components/ui";
import { PasswordInput, type PasswordCopy } from "@/components/password-input";

function Guardar({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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

export function RestablecerForm({
  token,
  copy,
}: {
  token: string;
  copy: { nueva: string; confirmar: string; hint: string; save: string; saving: string; toggle: PasswordCopy };
}) {
  const [state, action] = useActionState(restablecerClaveAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field label={copy.nueva} hint={copy.hint}>
        <PasswordInput name="nueva" autoComplete="new-password" minLength={8} copy={copy.toggle} />
      </Field>
      <Field label={copy.confirmar}>
        <PasswordInput name="confirmar" autoComplete="new-password" minLength={8} copy={copy.toggle} />
      </Field>
      {state.error ? (
        <p role="alert" className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}
      <Guardar label={copy.save} pendingLabel={copy.saving} />
    </form>
  );
}

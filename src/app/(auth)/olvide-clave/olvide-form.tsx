"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { solicitarRecuperacionAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";

function Enviar({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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

export function OlvideForm({
  copy,
}: {
  copy: { email: string; send: string; sending: string; done: string; back: string };
}) {
  const [state, action] = useActionState(solicitarRecuperacionAction, {});
  const [email, setEmail] = useState("");

  if (state.ok) {
    return (
      <div className="space-y-6">
        <p className="rounded-xl border border-moss/40 bg-moss-soft px-4 py-4 text-sm leading-relaxed text-moss-deep">
          {copy.done}
        </p>
        <Link href="/ingresar" className="text-sm font-semibold text-ink underline underline-offset-2">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Field label={copy.email}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      {state.error ? (
        <p role="alert" className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}
      <Enviar label={copy.send} pendingLabel={copy.sending} />
      <p className="text-center text-sm">
        <Link href="/ingresar" className="text-muted underline underline-offset-2 hover:text-ink">
          {copy.back}
        </Link>
      </p>
    </form>
  );
}

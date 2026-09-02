"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";

export type LoginCopy = {
  email: string;
  password: string;
  login: string;
  loggingIn: string;
  noAccount: string;
  createHere: string;
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

export function LoginForm({ next, copy }: { next: string; copy: LoginCopy }) {
  const [state, action] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label={copy.email}>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>

      <Field label={copy.password}>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>

      {state.error ? (
        <p className="rounded-xl border border-clay/40 bg-clay-soft px-4 py-3 text-sm text-clay-deep">
          {state.error}
        </p>
      ) : null}

      <Submit label={copy.login} pendingLabel={copy.loggingIn} />

      <p className="text-center text-sm text-muted">
        {copy.noAccount}{" "}
        <Link
          href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {copy.createHere}
        </Link>
      </p>
    </form>
  );
}

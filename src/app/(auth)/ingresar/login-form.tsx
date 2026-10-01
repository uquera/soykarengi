"use client";

import { useAccionSinReset } from "@/components/use-accion-sin-reset";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";
import { PasswordInput, type PasswordCopy } from "@/components/password-input";

export type LoginCopy = {
  email: string;
  password: string;
  passwordToggle: PasswordCopy;
  login: string;
  loggingIn: string;
  noAccount: string;
  createHere: string;
  forgot: string;
};

function Submit({ label, pendingLabel, pending }: { label: string; pendingLabel: string; pending: boolean }) {
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
  const { state, onSubmit, pending } = useAccionSinReset(loginAction, {});

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label={copy.email}>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>

      <Field label={copy.password}>
        <PasswordInput autoComplete="current-password" copy={copy.passwordToggle} />
      </Field>
      <p className="-mt-2 text-right text-[0.8125rem]">
        <Link href="/olvide-clave" className="text-muted underline underline-offset-2 hover:text-ink">
          {copy.forgot}
        </Link>
      </p>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit label={copy.login} pendingLabel={copy.loggingIn} pending={pending} />

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

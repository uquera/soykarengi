"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";

export type RegisterCopy = {
  fullName: string;
  namePlaceholder: string;
  email: string;
  phone: string;
  phoneHint: string;
  phonePlaceholder: string;
  password: string;
  passwordHint: string;
  register: string;
  registering: string;
  haveAccount: string;
  loginHere: string;
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

export function RegisterForm({ next, copy }: { next: string; copy: RegisterCopy }) {
  const [state, action] = useActionState(registerAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label={copy.fullName}>
        <input
          name="name"
          required
          autoComplete="name"
          className={inputClass}
          placeholder={copy.namePlaceholder}
        />
      </Field>

      <Field label={copy.email}>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>

      <Field label={copy.phone} hint={copy.phoneHint}>
        <input name="phone" autoComplete="tel" className={inputClass} placeholder={copy.phonePlaceholder} />
      </Field>

      <Field label={copy.password} hint={copy.passwordHint}>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit label={copy.register} pendingLabel={copy.registering} />

      <p className="text-center text-sm text-muted">
        {copy.haveAccount}{" "}
        <Link
          href={`/ingresar${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {copy.loginHere}
        </Link>
      </p>
    </form>
  );
}

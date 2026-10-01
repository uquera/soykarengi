"use client";

import { useAccionSinReset } from "@/components/use-accion-sin-reset";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";
import { PasswordInput, type PasswordCopy } from "@/components/password-input";

export type RegisterCopy = {
  fullName: string;
  namePlaceholder: string;
  email: string;
  phone: string;
  phoneHint: string;
  phonePlaceholder: string;
  password: string;
  passwordHint: string;
  passwordToggle: PasswordCopy;
  interest: string;
  interestHint: string;
  interestUnit1: string;
  interestUnit2: string;
  interestBoth: string;
  acceptLegal: string;
  privacyLink: string;
  termsLink: string;
  register: string;
  registering: string;
  haveAccount: string;
  loginHere: string;
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

export function RegisterForm({
  next,
  copy,
  interesPorDefecto,
}: {
  next: string;
  copy: RegisterCopy;
  interesPorDefecto: "ACOMPANAMIENTO" | "DISENOS" | "AMBAS";
}) {
  const { state, onSubmit, pending } = useAccionSinReset(registerAction, {});

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
        <PasswordInput autoComplete="new-password" minLength={8} copy={copy.passwordToggle} />
      </Field>

      {/* Karen trabaja dos unidades y quiere saber por cuál viene cada persona.
          Viene marcada la puerta por la que entró, y se puede cambiar. */}
      <fieldset className="block">
        <legend className="mb-1.5 block text-sm font-semibold text-ink">{copy.interest}</legend>
        <span className="mb-2 block text-xs text-muted">{copy.interestHint}</span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["ACOMPANAMIENTO", copy.interestUnit1],
              ["DISENOS", copy.interestUnit2],
              ["AMBAS", copy.interestBoth],
            ] as const
          ).map(([valor, etiqueta]) => (
            <label
              key={valor}
              className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2.5 text-center text-[0.8125rem] text-ink-soft transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-cream"
            >
              <input
                type="radio"
                name="interest"
                value={valor}
                defaultChecked={interesPorDefecto === valor}
                className="sr-only"
              />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Queda registrado qué versión de cada documento aceptó, con fecha e IP. */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="aceptaLegales" value="si" required className="mt-0.5 h-4 w-4 accent-[#38261A]" />
        <span>
          {copy.acceptLegal.split(/(\{privacidad\}|\{terminos\})/).map((parte) =>
            parte === "{privacidad}" ? (
              <a key={parte} href="/privacidad" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
                {copy.privacyLink}
              </a>
            ) : parte === "{terminos}" ? (
              <a key={parte} href="/terminos" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
                {copy.termsLink}
              </a>
            ) : (
              parte
            ),
          )}
        </span>
      </label>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit label={copy.register} pendingLabel={copy.registering} pending={pending} />

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

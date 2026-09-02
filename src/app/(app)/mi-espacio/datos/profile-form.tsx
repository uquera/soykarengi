"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui";

export type ProfileCopy = {
  fullName: string;
  email: string;
  emailHint: string;
  phone: string;
  phonePlaceholder: string;
  city: string;
  cityPlaceholder: string;
  save: string;
  saving: string;
  saved: string;
};

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ProfileForm({
  user,
  copy,
}: {
  user: { name: string; email: string; phone: string | null; city: string | null };
  copy: ProfileCopy;
}) {
  const [state, action] = useActionState(updateProfileAction, {});

  return (
    <form action={action} className="card-soft space-y-5 p-7">
      <Field label={copy.fullName}>
        <input name="name" defaultValue={user.name} required className={inputClass} />
      </Field>

      <Field label={copy.email} hint={copy.emailHint}>
        <input value={user.email} disabled className={`${inputClass} bg-shell text-muted`} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={copy.phone}>
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className={inputClass}
            placeholder={copy.phonePlaceholder}
          />
        </Field>
        <Field label={copy.city}>
          <input
            name="city"
            defaultValue={user.city ?? ""}
            className={inputClass}
            placeholder={copy.cityPlaceholder}
          />
        </Field>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-clay/40 bg-clay-soft px-4 py-3 text-sm text-clay-deep">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-xl border border-sage/40 bg-sage-soft px-4 py-3 text-sm text-sage-deep">
          {copy.saved}
        </p>
      ) : null}

      <Submit label={copy.save} pendingLabel={copy.saving} />
    </form>
  );
}

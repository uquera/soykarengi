import type { Metadata } from "next";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { tokenValido } from "@/lib/password-reset";
import { RestablecerForm } from "./restablecer-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.auth.resetTitle, robots: { index: false } };
}

export default async function RestablecerClavePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ token = "" }, t] = await Promise.all([searchParams, getDict()]);
  const registro = await tokenValido(token);

  if (!registro) {
    return (
      <>
        <header className="mb-9">
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.resetInvalid}</h1>
        </header>
        <Link
          href="/olvide-clave"
          className="inline-flex rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream hover:bg-ink-soft"
        >
          {t.auth.resetAgain}
        </Link>
      </>
    );
  }

  return (
    <>
      <header className="mb-9">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.resetTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.auth.resetLead}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{registro.user.email}</p>
      </header>
      <RestablecerForm
        token={token}
        copy={{
          nueva: t.auth.resetNew,
          confirmar: t.auth.resetConfirm,
          hint: t.auth.passwordHint,
          save: t.auth.resetSave,
          saving: t.auth.resetSaving,
          toggle: { show: t.auth.showPassword, hide: t.auth.hidePassword },
        }}
      />
    </>
  );
}

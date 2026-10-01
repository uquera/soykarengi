import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { OlvideForm } from "./olvide-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.auth.forgotTitle, robots: { index: false } };
}

export default async function OlvideClavePage() {
  const t = await getDict();
  return (
    <>
      <header className="mb-9">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.forgotTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.auth.forgotLead}</p>
      </header>
      <OlvideForm
        copy={{
          email: t.auth.email,
          send: t.auth.forgotSend,
          sending: t.auth.forgotSending,
          done: t.auth.forgotDone,
          back: t.auth.backToLogin,
        }}
      />
    </>
  );
}

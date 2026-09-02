import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.auth.login, description: t.auth.loginLead };
}

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/mi-espacio");

  const [{ next }, t] = await Promise.all([searchParams, getDict()]);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <>
      <header className="mb-9">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.auth.loginLead}</p>
      </header>
      <LoginForm
        next={safeNext}
        copy={{
          email: t.auth.email,
          password: t.auth.password,
          login: t.auth.login,
          loggingIn: t.auth.loggingIn,
          noAccount: t.auth.noAccount,
          createHere: t.auth.createHere,
        }}
      />
    </>
  );
}

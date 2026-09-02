import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.auth.register, description: t.auth.registerLead };
}

export default async function RegistroPage({
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
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.registerTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.auth.registerLead}</p>
      </header>
      <RegisterForm
        next={safeNext}
        copy={{
          fullName: t.auth.fullName,
          namePlaceholder: t.auth.namePlaceholder,
          email: t.auth.email,
          phone: t.auth.phone,
          phoneHint: t.auth.phoneHint,
          phonePlaceholder: "+1 (305) 555-0123",
          password: t.auth.password,
          passwordHint: t.auth.passwordHint,
          register: t.auth.register,
          registering: t.auth.registering,
          haveAccount: t.auth.haveAccount,
          loginHere: t.auth.loginHere,
        }}
      />
    </>
  );
}

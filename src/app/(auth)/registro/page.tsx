import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { rutaInterna } from "@/lib/next-url";
import { getDict } from "@/lib/i18n";
import { getUnidad, interesDesdeUnidad } from "@/lib/unidad";
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
  // Con la base y no solo con el token: una cookie de una cuenta borrada
  // mandaba de /ingresar a /mi-espacio y de vuelta, sin fin.
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/mi-espacio");

  const [{ next }, t, unidad] = await Promise.all([searchParams, getDict(), getUnidad()]);
  const safeNext = rutaInterna(next);

  return (
    <>
      <header className="mb-9">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{t.auth.registerTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.auth.registerLead}</p>
      </header>
      <RegisterForm
        next={safeNext}
        interesPorDefecto={interesDesdeUnidad(unidad)}
        copy={{
          fullName: t.auth.fullName,
          namePlaceholder: t.auth.namePlaceholder,
          email: t.auth.email,
          phone: t.auth.phone,
          phoneHint: t.auth.phoneHint,
          phonePlaceholder: "+1 …",
          password: t.auth.password,
          passwordHint: t.auth.passwordHint,
          passwordToggle: { show: t.auth.showPassword, hide: t.auth.hidePassword },
          interest: t.auth.interest,
          interestHint: t.auth.interestHint,
          interestUnit1: t.auth.interestUnit1,
          interestUnit2: t.auth.interestUnit2,
          interestBoth: t.auth.interestBoth,
          acceptLegal: t.auth.acceptLegal,
          privacyLink: t.auth.privacyLink,
          termsLink: t.auth.termsLink,
          register: t.auth.register,
          registering: t.auth.registering,
          haveAccount: t.auth.haveAccount,
          loginHere: t.auth.loginHere,
        }}
      />
    </>
  );
}

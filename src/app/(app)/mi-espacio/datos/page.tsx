import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { logoutAction } from "@/lib/actions/auth";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis datos" };

export default async function MisDatosPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <p className="eyebrow text-muted">{t.space.profile.eyebrow}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          {t.space.profile.title}
        </h1>
        <p className="mt-2 text-ink-soft">
          {t.space.profile.since} {shortDate(user.createdAt, locale)}. {t.space.profile.sinceNote}
        </p>
      </header>

      <ProfileForm
        user={{ name: user.name, email: user.email, phone: user.phone, city: user.city }}
        copy={{
          fullName: t.space.profile.fullName,
          email: t.space.profile.email,
          emailHint: t.space.profile.emailHint,
          phone: t.space.profile.phone,
          phonePlaceholder: "+1 (305) 555-0123",
          city: t.space.profile.city,
          cityPlaceholder: "Miami, FL",
          save: t.space.profile.save,
          saving: t.space.profile.saving,
          saved: t.space.profile.saved,
        }}
      />

      <div className="rounded-2xl border border-line bg-shell/70 p-6">
        <p className="font-semibold">{t.space.profile.logoutTitle}</p>
        <p className="mt-1 text-sm text-ink-soft">{t.space.profile.logoutLead}</p>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink/40"
          >
            {t.space.profile.logout}
          </button>
        </form>
      </div>
    </div>
  );
}

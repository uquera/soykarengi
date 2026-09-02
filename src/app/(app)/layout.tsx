import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg">
            {t.brand.name}
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">{user.name}</span>
            <LanguageToggle locale={locale} />
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
              >
                {t.nav.panel}
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
              >
                {t.nav.salir}
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

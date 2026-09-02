import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLockup, BrandMark } from "@/components/brand";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca */}
      <aside className="grain relative hidden flex-col justify-between bg-ink px-12 py-14 text-cream lg:flex">
        <div className="relative flex items-start justify-between gap-6">
          <BrandLockup name={t.brand.name} tagline={t.brand.tagline} size={52} tone="dark" />
          <LanguageToggle locale={locale} tone="dark" />
        </div>

        <div className="relative max-w-md">
          <p className="font-[family-name:var(--font-display)] text-3xl leading-tight text-balance">
            {t.auth.panelTitle}
          </p>
          <p className="mt-5 leading-relaxed text-cream/60">{t.auth.panelLead}</p>
        </div>

        <p className="relative text-xs text-cream/40">{t.brand.quote}</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <BrandLockup name={t.brand.name} size={40} />
            <LanguageToggle locale={locale} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

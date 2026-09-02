import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LanguageToggle } from "@/components/language-toggle";
import { getSession } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, t, locale] = await Promise.all([getSession(), getDict(), getLocale()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        session={session ? { name: session.name, role: session.role } : null}
        copy={{ brand: t.brand.name, tagline: t.brand.tagline, nav: t.nav }}
        languageToggle={<LanguageToggle locale={locale} />}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { BrandMark } from "@/components/brand";

export async function SiteFooter() {
  const t = await getDict();

  const columns = [
    {
      title: t.footer.colAcompanamiento,
      links: [
        { href: "/acompanamiento", label: t.footer.sobreKaren },
        { href: "/acompanamiento/servicios", label: t.footer.servicios },
        { href: "/acompanamiento/especialidades", label: t.footer.especialidades },
        { href: "/acompanamiento/agenda", label: t.footer.agendar },
      ],
    },
    {
      title: t.footer.colDisenos,
      links: [
        { href: "/disenos", label: t.footer.vitrina },
        { href: "/disenos?grupo=EVENTOS", label: t.footer.eventos },
        { href: "/disenos?grupo=PERSONAL", label: t.footer.personal },
        { href: "/configurador", label: t.footer.configurador },
      ],
    },
    {
      title: t.footer.colPlataforma,
      links: [
        { href: "/mi-espacio", label: t.space.label },
        { href: "/blog", label: t.nav.blog },
        { href: "/recursos", label: t.nav.recursos },
        { href: "/contacto", label: t.nav.contacto },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-shell">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandMark size={56} />
          <p className="mt-4 font-[family-name:var(--font-display)] text-xl">{t.brand.name}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-sm text-muted italic">
            {t.brand.tagline}
          </p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">{t.brand.quote}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4 text-ink">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {t.brand.name} · SoyKarengi. {t.footer.rights}
          </p>
          <p>
            {t.footer.builtBy} <span className="font-semibold text-ink-soft">HYPNOS</span> ·
            hypnosapps@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
}

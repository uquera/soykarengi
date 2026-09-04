import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { BrandMark } from "@/components/brand";

export async function SiteFooter() {
  const t = await getDict();

  /* El menú se redujo a cinco entradas; el pie recoge lo que salió de arriba,
     incluidas las páginas por especialidad y por categoría que existen por SEO. */
  const columns = [
    {
      title: t.footer.colAcompanamiento,
      links: [
        { href: "/acompanamiento", label: t.footer.sobreKaren },
        { href: "/acompanamiento/psicologia", label: t.specialty.pages.psicologia.title },
        { href: "/acompanamiento/life-coaching", label: t.specialty.pages["life-coaching"].title },
        { href: "/acompanamiento/mentoria", label: t.specialty.pages.mentoria.title },
        { href: "/acompanamiento/servicios", label: t.footer.servicios },
        { href: "/acompanamiento/agenda", label: t.footer.agendar },
        { href: "/crp", label: t.crp.title },
      ],
    },
    {
      title: t.footer.colDisenos,
      links: [
        { href: "/disenos", label: t.footer.vitrina },
        { href: "/disenos?grupo=VISTE", label: t.designs.groups.VISTE.name },
        { href: "/disenos?grupo=REGALA", label: t.designs.groups.REGALA.name },
        { href: "/disenos?grupo=CELEBRA", label: t.designs.groups.CELEBRA.name },
        { href: "/disenos?grupo=MARCA", label: t.designs.groups.MARCA.name },
        { href: "/disenos?grupo=HUELLA", label: t.designs.groups.HUELLA.name },
        { href: "/configurador", label: t.footer.configurador },
      ],
    },
    {
      title: t.footer.colPlataforma,
      links: [
        { href: "/mi-espacio", label: t.space.label },
        { href: "/recursos", label: t.nav.recursos },
        { href: "/blog", label: t.nav.blog },
        { href: "/contacto", label: t.nav.contacto },
        { href: "/ingresar", label: t.nav.ingresar },
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
            © {new Date().getFullYear()} {t.brand.name} · Karen Ramos. {t.footer.rights}
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

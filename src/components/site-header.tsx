"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/brand";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type HeaderCopy = {
  brand: string;
  tagline: string;
  nav: {
    acompanamiento: string;
    disenos: string;
    configurador: string;
    recursos: string;
    blog: string;
    contacto: string;
    ingresar: string;
    registro: string;
    miEspacio: string;
    panel: string;
    menu: string;
  };
};

export function SiteHeader({
  session,
  copy,
  languageToggle,
}: {
  session: { name: string; role: string } | null;
  copy: HeaderCopy;
  languageToggle: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const nav = [
    { href: "/acompanamiento", label: copy.nav.acompanamiento },
    { href: "/disenos", label: copy.nav.disenos },
    { href: "/configurador", label: copy.nav.configurador },
    { href: "/recursos", label: copy.nav.recursos },
    { href: "/blog", label: copy.nav.blog },
    { href: "/contacto", label: copy.nav.contacto },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6">
        <BrandLockup name={copy.brand} tagline={copy.tagline} size={40} taglineClassName="hidden xl:block" />

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-[0.8125rem] font-medium transition-colors ${
                  active ? "bg-shell text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">{languageToggle}</span>

          {session ? (
            <>
              {session.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="hidden rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40 hover:text-ink sm:inline-flex"
                >
                  {copy.nav.panel}
                </Link>
              ) : null}
              <Link
                href="/mi-espacio"
                className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
              >
                {copy.nav.miEspacio}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/ingresar"
                className="hidden rounded-full px-3 py-2 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
              >
                {copy.nav.ingresar}
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
              >
                {copy.nav.registro}
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={copy.nav.menu}
            aria-expanded={open}
            className="ml-1 grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
              <path
                d={open ? "M2 2 L14 10 M14 2 L2 10" : "M0 1h16M0 6h16M0 11h16"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-cream px-5 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-b border-line/60 py-3 text-sm font-medium text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 sm:hidden">{languageToggle}</div>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { title?: string; items: NavItem[] };

export function PanelNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-7">
      {groups.map((group, gi) => (
        <div key={group.title ?? gi}>
          {group.title ? <p className="eyebrow mb-3 px-3 text-muted">{group.title}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/mi-espacio" && item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-ink font-semibold text-cream" : "text-ink-soft hover:bg-shell"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                          active ? "bg-cream/20 text-cream" : "bg-clay-soft text-clay-deep"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

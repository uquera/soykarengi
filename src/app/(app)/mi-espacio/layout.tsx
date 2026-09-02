import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { getDict } from "@/lib/i18n";
import { PanelNav } from "@/components/panel-nav";

export const dynamic = "force-dynamic";

export default async function MiEspacioLayout({ children }: { children: React.ReactNode }) {
  const [user, t] = await Promise.all([requireUser(), getDict()]);

  const [citas, disenos, pedidos, archivos, favoritos] = await Promise.all([
    db.appointment.count({ where: { userId: user.id, status: { in: ["PENDIENTE", "CONFIRMADA"] } } }),
    db.designRequest.count({ where: { userId: user.id, NOT: { status: "CANCELADA" } } }),
    db.designRequest.count({ where: { userId: user.id, status: { in: ORDER_STATUSES } } }),
    db.deliverable.count({ where: { request: { userId: user.id } } }),
    db.favorite.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="shell grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <p className="eyebrow mb-5 px-3 text-clay">{t.space.label}</p>
        <PanelNav
          groups={[
            {
              items: [
                { href: "/mi-espacio", label: t.space.nav.resumen },
                { href: "/mi-espacio/citas", label: t.space.nav.citas, badge: citas },
                { href: "/mi-espacio/disenos", label: t.space.nav.disenos, badge: disenos },
                { href: "/mi-espacio/pedidos", label: t.space.nav.pedidos, badge: pedidos },
                { href: "/mi-espacio/archivos", label: t.space.nav.archivos, badge: archivos },
                { href: "/mi-espacio/favoritos", label: t.space.nav.favoritos, badge: favoritos },
                { href: "/mi-espacio/datos", label: t.space.nav.datos },
              ],
            },
          ]}
        />
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

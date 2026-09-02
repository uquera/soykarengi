import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { PanelNav } from "@/components/panel-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const [pendientes, solicitudes, pedidos, mensajes] = await Promise.all([
    db.appointment.count({ where: { status: "PENDIENTE" } }),
    db.designRequest.count({ where: { status: { in: ["SOLICITUD", "APROBADA"] } } }),
    db.designRequest.count({ where: { status: { in: ORDER_STATUSES, notIn: ["ENTREGADA"] } } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);

  return (
    <div className="shell grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <p className="eyebrow mb-5 px-3 text-ink">Panel · Karen Ramos</p>
        <PanelNav
          groups={[
            { items: [{ href: "/admin", label: "Dashboard" }] },
            {
              title: "Unidad Servicios",
              items: [
                { href: "/admin/servicios", label: "Servicios" },
                { href: "/admin/agenda", label: "Agenda y citas", badge: pendientes },
              ],
            },
            {
              title: "Unidad Diseños",
              items: [
                { href: "/admin/categorias", label: "Categorías" },
                { href: "/admin/disenos", label: "Diseños" },
                { href: "/admin/solicitudes", label: "Solicitudes", badge: solicitudes },
                { href: "/admin/pedidos", label: "Pedidos", badge: pedidos },
              ],
            },
            {
              title: "Transversal",
              items: [
                { href: "/admin/clientes", label: "Clientes" },
                { href: "/admin/contenido", label: "Contenido" },
                { href: "/admin/mensajes", label: "Mensajes", badge: mensajes },
                { href: "/admin/estadisticas", label: "Estadísticas" },
              ],
            },
          ]}
        />
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

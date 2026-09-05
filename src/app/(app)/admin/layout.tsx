import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { PanelNav } from "@/components/panel-nav";
import { getLicenciaStatus } from "@/lib/licencia";
import { LicenciaBanner } from "@/components/licencia";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  // Con el servicio cortado /admin/licencia sigue abierta: es la pantalla que
  // explica qué pasó y a quién escribirle. El resto del panel se bloquea.
  const [licencia, ruta] = await Promise.all([
    getLicenciaStatus(),
    headers().then((h) => h.get("x-pathname") ?? ""),
  ]);
  if (licencia.bloqueada && !ruta.startsWith("/admin/licencia")) redirect("/suspendido");

  const [pendientes, solicitudes, pedidos, mensajes] = await Promise.all([
    db.appointment.count({ where: { status: "PENDIENTE" } }),
    db.designRequest.count({ where: { status: { in: ["SOLICITUD", "APROBADA"] } } }),
    db.designRequest.count({ where: { status: { in: ORDER_STATUSES, notIn: ["ENTREGADA"] } } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);

  return (
    <>
      <LicenciaBanner licencia={licencia} />
      <div className="shell grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <p className="eyebrow mb-5 px-3 text-ink">Panel · SoyKarengi</p>
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
                { href: "/admin/pedidos", label: "Pedidos y pagos", badge: pedidos },
              ],
            },
            {
              title: "Transversal",
              items: [
                { href: "/admin/clientes", label: "Clientes" },
                { href: "/admin/contenido", label: "Contenido" },
                { href: "/admin/mensajes", label: "Mensajes", badge: mensajes },
                { href: "/admin/finanzas", label: "Finanzas" },
                { href: "/admin/estadisticas", label: "Reportes" },
                { href: "/admin/licencia", label: "Licencia" },
              ],
            },
          ]}
        />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}

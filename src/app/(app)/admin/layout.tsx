import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { PanelNav } from "@/components/panel-nav";
import { getLicenciaStatus } from "@/lib/licencia";
import { LicenciaBanner } from "@/components/licencia";
import { cambiarPanelAction } from "@/lib/actions/panel";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  // Con el servicio cortado /admin/licencia sigue abierta: es la pantalla que
  // explica qué pasó y a quién escribirle. El resto del panel se bloquea.
  const [licencia, ruta] = await Promise.all([
    getLicenciaStatus(),
    headers().then((h) => h.get("x-pathname") ?? ""),
  ]);
  if (licencia.bloqueada && !ruta.startsWith("/admin/licencia")) redirect("/suspendido");

  // Karen entra por el panel sencillo: «/admin» la lleva ahí. Las páginas
  // interiores (blog, calendario completo) siguen abiertas para cuando las
  // enlaza el panel sencillo.
  if (user.panelSimple && (ruta === "/admin" || ruta === "/admin/")) redirect("/panel");

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
                { href: "/admin/estadisticas", label: "Estadísticas" },
                { href: "/admin/configuracion", label: "Configuración" },
                { href: "/admin/licencia", label: "Licencia" },
              ],
            },
          ]}
        />
          {/* Quien prefiere el panel sencillo vuelve a él con un toque. */}
          <form action={cambiarPanelAction} className="mt-6 px-3">
            <input type="hidden" name="modo" value="sencillo" />
            <button
              type="submit"
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[0.8125rem] font-semibold text-ink-soft hover:border-ink/40"
            >
              ← Panel sencillo
            </button>
          </form>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}

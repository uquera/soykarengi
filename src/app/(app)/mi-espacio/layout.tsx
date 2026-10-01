import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/domain";
import { getDict } from "@/lib/i18n";
import { PanelNav } from "@/components/panel-nav";
import { redirect } from "next/navigation";
import { getLicenciaStatus } from "@/lib/licencia";
import { aceptoVigente } from "@/lib/legal";
import { aceptarLegalesAction } from "@/lib/actions/auth";
import { FormAccion } from "@/components/form-accion";

export const dynamic = "force-dynamic";

export default async function MiEspacioLayout({ children }: { children: React.ReactNode }) {
  const [user, t, licencia] = await Promise.all([requireUser(), getDict(), getLicenciaStatus()]);

  // El corte por licencia es de toda la plataforma privada, no solo del panel.
  if (licencia.bloqueada) redirect("/suspendido");

  const [citas, disenos, pedidos, archivos, favoritos] = await Promise.all([
    db.appointment.count({
      where: { userId: user.id, status: { in: ["PENDIENTE", "CONFIRMADA"] }, startsAt: { gte: new Date() } },
    }),
    db.designRequest.count({ where: { userId: user.id, NOT: { status: "CANCELADA" } } }),
    db.designRequest.count({ where: { userId: user.id, status: { in: ORDER_STATUSES } } }),
    // El número de «Mis archivos» es lo que Karen le mandó y aún no abre.
    db.archivo.count({
      where: { userId: user.id, tipo: { in: ["COMPARTIDO", "ENTREGABLE"] }, vistoAt: null },
    }),
    db.favorite.count({ where: { userId: user.id } }),
  ]);

  // Quien tiene cuenta desde antes, o cuando Karen publica una versión nueva,
  // acepta aquí la privacidad y los términos vigentes.
  const [privacidad, terminos] = await Promise.all([
    aceptoVigente(user.id, "PRIVACIDAD"),
    aceptoVigente(user.id, "TERMINOS"),
  ]);
  const faltaAceptar = user.role !== "ADMIN" && (!privacidad.aceptada || !terminos.aceptada);
  const p = t.space.profile;

  return (
    <div className="shell grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:items-start">
      {faltaAceptar ? (
        <div className="rounded-2xl border border-amber/40 bg-amber/10 px-6 py-5 lg:col-span-2">
          <p className="font-semibold text-amber-ink">{p.legalTitle}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {p.legalLead.split(/(\{privacidad\}|\{terminos\})/).map((parte) =>
              parte === "{privacidad}" ? (
                <a key={parte} href="/privacidad" target="_blank" rel="noopener" className="font-semibold underline">
                  {t.auth.privacyLink}
                </a>
              ) : parte === "{terminos}" ? (
                <a key={parte} href="/terminos" target="_blank" rel="noopener" className="font-semibold underline">
                  {t.auth.termsLink}
                </a>
              ) : (
                parte
              ),
            )}
          </p>
          <FormAccion action={aceptarLegalesAction} className="mt-3">
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-[0.8125rem] font-semibold text-cream hover:bg-ink-soft"
            >
              {p.legalAccept}
            </button>
          </FormAccion>
        </div>
      ) : null}
      <aside className="lg:sticky lg:top-24">
        <p className="eyebrow mb-5 px-3 text-rose">{t.space.label}</p>
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

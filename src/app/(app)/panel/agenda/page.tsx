import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { diaHumano, grupoAgenda, hora } from "@/lib/simple";
import { deleteBlackoutAction } from "@/lib/actions/booking";
import { FormAccion } from "@/components/form-accion";
import { BTN, Encabezado, Seccion, Vacio } from "@/components/panel-sencillo-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Agenda" };

const GRUPOS = ["Hoy", "Mañana", "Esta semana", "Más adelante"] as const;

/** La agenda como lista: quién viene y cuándo, sin calendario que arrastrar. */
export default async function AgendaSencillaPage({ searchParams }: { searchParams: Promise<{ agendada?: string }> }) {
  await requireAdmin();
  const { agendada } = await searchParams;
  const ahora = new Date();
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  const [citas, libres] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: ["PENDIENTE", "CONFIRMADA"] },
        startsAt: { gte: hoy, lt: new Date(ahora.getTime() + 60 * 86_400_000) },
      },
      orderBy: { startsAt: "asc" },
      include: { user: true, service: true },
    }),
    db.blackout.findMany({ where: { endsAt: { gt: ahora } }, orderBy: { startsAt: "asc" } }),
  ]);

  const porGrupo = GRUPOS.map((g) => ({ grupo: g, citas: citas.filter((c) => grupoAgenda(c.startsAt) === g) })).filter(
    (g) => g.citas.length > 0,
  );

  return (
    <div className="space-y-8">
      <Encabezado titulo="Agenda" bajada="Tus próximas citas, de la más cercana a la más lejana." />

      {agendada ? (
        <p className="rounded-2xl border border-moss/40 bg-moss-soft px-5 py-4 text-[1rem] text-moss-deep">
          Listo, la cita quedó agendada y confirmada. A la persona le llegó un correo.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/panel/agenda/nueva" className={BTN.principal}>
          + Agendar a alguien
        </Link>
        <Link href="/panel/agenda/libre" className={BTN.secundario}>
          Tomarme días libres
        </Link>
      </div>

      {porGrupo.length === 0 ? (
        <Vacio titulo="No tienes citas próximas" texto="Cuando alguien reserve desde la web, aparecerá aquí." />
      ) : (
        porGrupo.map(({ grupo, citas: lista }) => (
          <Seccion key={grupo} titulo={grupo}>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {lista.map((c) => (
                <li key={c.id}>
                  <Link href={`/panel/cita/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-shell/50">
                    <span className="w-24 shrink-0 text-[1.0625rem] font-semibold text-ink">{hora(c.startsAt)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{c.user.name}</span>
                      <span className="block truncate text-[0.9375rem] text-muted">
                        {grupo === "Hoy" || grupo === "Mañana" ? "" : `${diaHumano(c.startsAt)} · `}
                        {c.service.name}
                      </span>
                    </span>
                    {c.status === "PENDIENTE" ? (
                      <span className="shrink-0 rounded-full bg-amber/15 px-3 py-1 text-[0.8125rem] font-semibold text-amber-ink">
                        Por confirmar
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        ))
      )}

      {libres.length > 0 ? (
        <Seccion titulo="Tus días libres">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {libres.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span>
                  <span className="block font-semibold text-ink">{b.reason || "Día libre"}</span>
                  <span className="text-[0.9375rem] text-muted">
                    {b.allDay
                      ? diaHumano(b.startsAt) === diaHumano(new Date(b.endsAt.getTime() - 1))
                        ? diaHumano(b.startsAt)
                        : `${diaHumano(b.startsAt)} al ${diaHumano(new Date(b.endsAt.getTime() - 1)).toLowerCase()}`
                      : `${diaHumano(b.startsAt)}, ${hora(b.startsAt)} a ${hora(b.endsAt)}`}
                  </span>
                </span>
                <FormAccion action={deleteBlackoutAction} confirmar="¿Volver a abrir estos días en la agenda?">
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="text-[0.9375rem] font-semibold text-muted underline underline-offset-4 hover:text-ink">
                    Quitar
                  </button>
                </FormAccion>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

      <p className="text-center text-[0.9375rem]">
        <Link href="/admin/agenda" className="text-muted underline underline-offset-4 hover:text-ink">
          Ver el calendario completo
        </Link>
      </p>
    </div>
  );
}

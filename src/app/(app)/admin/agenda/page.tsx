import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateTime, money, shortDate } from "@/lib/format";
import { APPOINTMENT_LABEL, APPOINTMENT_STATUSES } from "@/lib/domain";
import Link from "next/link";
import { businessHoursRanges, CALENDAR_WINDOW } from "@/lib/availability";
import { FormAccion } from "@/components/form-accion";
import {
  guardarEnlaceAction,
  saveAppointmentNotesAction,
  setAppointmentStatusAction,
} from "@/lib/actions/booking";
import { deleteBlackoutAction } from "@/lib/actions/booking";
import { Badge, EmptyState, inputClass } from "@/components/ui";
import { AgendaCalendar } from "@/components/admin/agenda-calendar";
import { BUSINESS_TZ } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Agenda y citas" };

const FILTERS = [
  { key: "proximas", label: "Próximas" },
  { key: "PENDIENTE", label: "Por confirmar" },
  { key: "CONFIRMADA", label: "Confirmadas" },
  { key: "COMPLETADA", label: "Realizadas" },
  { key: "CANCELADA", label: "Canceladas" },
  { key: "todas", label: "Todas" },
];

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireAdmin();
  const { f = "proximas" } = await searchParams;

  const where =
    f === "proximas"
      ? { startsAt: { gte: new Date() }, status: { in: ["PENDIENTE", "CONFIRMADA"] } }
      : f === "todas"
        ? {}
        : { status: f };

  // El calendario carga una ventana amplia alrededor de hoy; la lista respeta el filtro.
  const from = new Date();
  from.setMonth(from.getMonth() - 2);
  const to = new Date();
  to.setMonth(to.getMonth() + 6);

  const [appointments, calendarRaw, blackouts, services] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: { startsAt: f === "proximas" ? "asc" : "desc" },
      include: { user: true, service: true },
      take: 100,
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: from, lte: to } },
      include: { user: true, service: true },
    }),
    db.blackout.findMany({ where: { endsAt: { gte: from } }, orderBy: { startsAt: "asc" } }),
    db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  const calendarEvents = calendarRaw.map((a) => {
    const end = new Date(a.startsAt);
    end.setMinutes(end.getMinutes() + a.service.durationMin);
    return {
      id: a.id,
      code: a.code,
      startsAt: a.startsAt.toISOString(),
      endsAt: end.toISOString(),
      status: a.status,
      modality: a.modality,
      reason: a.reason,
      notes: a.notes,
      firstTime: a.firstTime,
      clientName: a.user.name,
      clientEmail: a.user.email,
      clientPhone: a.user.phone,
      serviceName: a.service.name,
      servicePrice: a.service.price,
    };
  });

  const upcomingBlackouts = blackouts.filter((b) => b.endsAt >= new Date());

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-orchid-deep">Unidad Servicios</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Agenda y citas</h1>
        <p className="mt-2 text-ink-soft">
          Tu semana completa hora por hora. Arrastra una cita para moverla, o selecciona un rango libre
          para agendar a alguien o bloquear el horario.
        </p>
      </header>

      <AgendaCalendar
        appointments={calendarEvents}
        blackouts={blackouts.map((b) => ({
          id: b.id,
          startsAt: b.startsAt.toISOString(),
          endsAt: b.endsAt.toISOString(),
          allDay: b.allDay,
          reason: b.reason,
        }))}
        businessHours={await businessHoursRanges()}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMin: s.durationMin,
          modality: s.modality,
        }))}
        window={CALENDAR_WINDOW}
      />

      {upcomingBlackouts.length > 0 ? (
        <section className="card-soft p-6">
          <p className="eyebrow text-muted">Horarios bloqueados</p>
          <ul className="mt-4 divide-y divide-line">
            {upcomingBlackouts.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">{b.reason || "Tiempo bloqueado"}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">
                    {b.allDay
                      ? `${shortDate(b.startsAt)} · día completo`
                      : `${dateTime(b.startsAt)} → ${new Date(b.endsAt).toLocaleTimeString("es-US", { timeZone: BUSINESS_TZ, hour: "numeric", minute: "2-digit" })}`}
                  </p>
                </div>
                <FormAccion action={deleteBlackoutAction} confirmar="¿Liberar este horario? Volverá a ofrecerse en la agenda.">
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                  >
                    Liberar
                  </button>
                </FormAccion>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-5">
        <h2 className="eyebrow text-muted">Listado</h2>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <a
              key={filter.key}
              href={`/admin/agenda?f=${filter.key}`}
              className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                f === filter.key ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
              }`}
            >
              {filter.label}
            </a>
          ))}
        </div>

        {appointments.length === 0 ? (
          <EmptyState title="Sin citas en este filtro" lead="Prueba con otro estado." />
        ) : (
          <div className="space-y-4">
            {appointments.map((a) => (
              <article key={a.id} className="card-soft p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          a.status === "CONFIRMADA"
                            ? "orchid"
                            : a.status === "PENDIENTE"
                              ? "amber"
                              : a.status === "CANCELADA"
                                ? "muted"
                                : "neutral"
                        }
                      >
                        {APPOINTMENT_LABEL[a.status]}
                      </Badge>
                      <Badge tone="muted">{a.modality}</Badge>
                      {a.firstTime ? <Badge tone="rose">Primera vez</Badge> : null}
                    </div>

                    <Link
                      href={`/admin/clientes/${a.user.id}`}
                      className="mt-3 block font-[family-name:var(--font-display)] text-2xl leading-snug hover:underline"
                    >
                      {a.user.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      {a.service.name} · {dateTime(a.startsAt)}
                      {(a.price ?? a.service.price) > 0 ? ` · ${money(a.price ?? a.service.price)}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {a.user.email}
                      {a.user.phone ? ` · ${a.user.phone}` : ""} · {a.code}
                    </p>
                  </div>

                  <FormAccion action={setAppointmentStatusAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <select name="status" defaultValue={a.status} className={`${inputClass} w-auto py-2`}>
                      {APPOINTMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {APPOINTMENT_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                    >
                      Guardar
                    </button>
                  </FormAccion>
                </div>

                <div className="mt-5 rounded-xl bg-shell/70 px-4 py-3">
                  <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                    Formulario previo
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{a.reason}</p>
                </div>

                {a.modality === "Online" && (a.status === "PENDIENTE" || a.status === "CONFIRMADA") ? (
                  <FormAccion
                    action={guardarEnlaceAction}
                    okMensaje="Enlace guardado. Si la cita está confirmada, le llegó por correo."
                    className="mt-4 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <label className="sr-only" htmlFor={`enlace-${a.id}`}>
                      Enlace de la videollamada
                    </label>
                    <input
                      id={`enlace-${a.id}`}
                      name="meetingUrl"
                      type="url"
                      defaultValue={a.meetingUrl ?? ""}
                      placeholder="Enlace de la videollamada (https://meet.google.com/…)"
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
                    >
                      Guardar enlace
                    </button>
                  </FormAccion>
                ) : null}

                <FormAccion action={saveAppointmentNotesAction} okMensaje="Nota guardada." className="mt-4 space-y-2">
                  <input type="hidden" name="id" value={a.id} />
                  <label htmlFor={`nota-${a.id}`} className="block text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                    Notas privadas · solo tú las ves
                  </label>
                  <textarea
                    id={`nota-${a.id}`}
                    name="notes"
                    rows={3}
                    defaultValue={a.notes ?? ""}
                    placeholder="Lo que quieras recordar de esta sesión…"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
                  >
                    Guardar nota
                  </button>
                </FormAccion>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

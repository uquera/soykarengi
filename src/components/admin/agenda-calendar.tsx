"use client";

import { useRef, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventClickArg, EventDropArg, DateSelectArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import {
  rescheduleAppointmentAction,
  setAppointmentStatusAction,
  saveAppointmentNotesAction,
  createBlackoutAction,
  deleteBlackoutAction,
  adminCreateAppointmentAction,
} from "@/lib/actions/booking";
import { APPOINTMENT_LABEL, APPOINTMENT_STATUSES } from "@/lib/domain";
import { inputClass } from "@/components/ui";

export type CalendarAppointment = {
  id: string;
  code: string;
  startsAt: string;
  endsAt: string;
  status: string;
  modality: string;
  reason: string;
  notes: string | null;
  firstTime: boolean;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceName: string;
  servicePrice: number;
};

export type CalendarBlackout = {
  id: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  reason: string | null;
};

type BusinessHours = { daysOfWeek: number[]; startTime: string; endTime: string };
type ServiceOption = { id: string; name: string; durationMin: number; modality: string };

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "#C0972F",
  CONFIRMADA: "#6E8B74",
  COMPLETADA: "#8A7E73",
  CANCELADA: "#C9BEB1",
};

const LOCKED = ["COMPLETADA", "CANCELADA"];

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fullDate(value: string | Date) {
  return new Date(value).toLocaleString("es-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AgendaCalendar({
  appointments,
  blackouts,
  businessHours,
  services,
  window: hours,
}: {
  appointments: CalendarAppointment[];
  blackouts: CalendarBlackout[];
  businessHours: BusinessHours[];
  services: ServiceOption[];
  window: { min: string; max: string };
}) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [pending, startTransition] = useTransition();

  const [detail, setDetail] = useState<CalendarAppointment | null>(null);
  const [blocked, setBlocked] = useState<CalendarBlackout | null>(null);
  const [slot, setSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [slotMode, setSlotMode] = useState<"cita" | "bloqueo">("cita");

  const events = [
    ...appointments.map((a) => ({
      id: a.id,
      title: `${a.clientName} · ${a.serviceName}`,
      start: a.startsAt,
      end: a.endsAt,
      backgroundColor: STATUS_COLOR[a.status] ?? "#8A7E73",
      borderColor: STATUS_COLOR[a.status] ?? "#8A7E73",
      textColor: "#ffffff",
      editable: !LOCKED.includes(a.status),
      extendedProps: { kind: "cita" as const, data: a },
    })),
    ...blackouts.map((b) => ({
      id: `blackout-${b.id}`,
      title: b.reason ? `🔒 ${b.reason}` : "🔒 Bloqueado",
      start: b.startsAt,
      end: b.endsAt,
      allDay: b.allDay,
      backgroundColor: "#E4D9CB",
      borderColor: "#C9BEB1",
      textColor: "#4E463F",
      editable: false,
      extendedProps: { kind: "bloqueo" as const, data: b },
    })),
  ];

  function run(action: (fd: FormData) => Promise<unknown>, fd: FormData, after?: () => void) {
    startTransition(async () => {
      await action(fd);
      router.refresh();
      after?.();
    });
  }

  function handleEventClick(info: EventClickArg) {
    const props = info.event.extendedProps as
      | { kind: "cita"; data: CalendarAppointment }
      | { kind: "bloqueo"; data: CalendarBlackout };

    if (props.kind === "cita") setDetail(props.data);
    else setBlocked(props.data);
  }

  function handleEventDrop(info: EventDropArg) {
    const props = info.event.extendedProps as { kind: string; data: CalendarAppointment };
    if (props.kind !== "cita" || !info.event.start) return info.revert();

    const fd = new FormData();
    fd.set("id", props.data.id);
    fd.set("startsAt", info.event.start.toISOString());
    run(rescheduleAppointmentAction, fd);
  }

  function handleSelect(info: DateSelectArg) {
    setSlot({ start: info.start, end: info.end });
    setSlotMode("cita");
    calendarRef.current?.getApi().unselect();
  }

  return (
    <>
      <div className="card-soft agenda-calendar overflow-hidden p-4 sm:p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          timeZone="local"
          events={events}
          eventClick={handleEventClick}
          selectable
          selectMirror
          select={handleSelect}
          editable
          eventDrop={handleEventDrop}
          eventDurationEditable={false}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          slotMinTime={hours.min}
          slotMaxTime={hours.max}
          slotDuration="01:00:00"
          snapDuration="01:00:00"
          businessHours={businessHours}
          allDaySlot
          allDayText="Todo el día"
          expandRows
          height="auto"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          nowIndicator
          weekends
        />

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {APPOINTMENT_LABEL[status]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            Bloqueado
          </span>
          <span className="ml-auto">
            Arrastra una cita para moverla · selecciona un rango libre para agendar o bloquear
          </span>
        </div>
      </div>

      {/* Detalle de una cita */}
      {detail ? (
        <Modal onClose={() => setDetail(null)} title={detail.clientName}>
          <p className="text-sm text-ink-soft">
            {detail.serviceName} · {fullDate(detail.startsAt)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {detail.clientEmail}
            {detail.clientPhone ? ` · ${detail.clientPhone}` : ""} · {detail.modality} · {detail.code}
          </p>

          <div className="mt-5 rounded-xl bg-shell/70 px-4 py-3">
            <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
              Formulario previo
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{detail.reason}</p>
          </div>

          <form
            action={(fd) => run(setAppointmentStatusAction, fd, () => setDetail(null))}
            className="mt-5 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={detail.id} />
            <select name="status" defaultValue={detail.status} className={`${inputClass} w-auto py-2`}>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APPOINTMENT_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
            >
              Cambiar estado
            </button>
          </form>

          <form
            action={(fd) => run(saveAppointmentNotesAction, fd, () => setDetail(null))}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input type="hidden" name="id" value={detail.id} />
            <input
              name="notes"
              defaultValue={detail.notes ?? ""}
              placeholder="Notas internas de la sesión…"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40 disabled:opacity-50"
            >
              Guardar nota
            </button>
          </form>
        </Modal>
      ) : null}

      {/* Detalle de un bloqueo */}
      {blocked ? (
        <Modal onClose={() => setBlocked(null)} title={blocked.reason || "Tiempo bloqueado"}>
          <p className="text-sm text-ink-soft">
            {blocked.allDay
              ? `Día completo · ${new Date(blocked.startsAt).toLocaleDateString("es-US", { weekday: "long", day: "numeric", month: "long" })}`
              : `${fullDate(blocked.startsAt)} → ${new Date(blocked.endsAt).toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" })}`}
          </p>
          <p className="mt-3 text-sm text-muted">
            Mientras exista este bloqueo, esos horarios no se ofrecen en la agenda pública.
          </p>

          <form
            action={(fd) => run(deleteBlackoutAction, fd, () => setBlocked(null))}
            className="mt-6"
          >
            <input type="hidden" name="id" value={blocked.id} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-clay/50 hover:text-clay-deep disabled:opacity-50"
            >
              Liberar este horario
            </button>
          </form>
        </Modal>
      ) : null}

      {/* Rango libre seleccionado: agendar o bloquear */}
      {slot ? (
        <Modal onClose={() => setSlot(null)} title={fullDate(slot.start)}>
          <div className="mb-6 flex gap-2">
            {(
              [
                ["cita", "Agendar cita"],
                ["bloqueo", "Bloquear horario"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSlotMode(mode)}
                className={`flex-1 rounded-full px-4 py-2 text-[0.8125rem] font-semibold transition-colors ${
                  slotMode === mode ? "bg-ink text-cream" : "bg-shell text-ink-soft hover:bg-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {slotMode === "cita" ? (
            <form
              action={(fd) => run(adminCreateAppointmentAction, fd, () => setSlot(null))}
              className="space-y-4"
            >
              <input type="hidden" name="startsAt" value={slot.start.toISOString()} />

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Servicio</span>
                <select name="serviceId" required className={inputClass}>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Nombre</span>
                  <input name="name" required className={inputClass} placeholder="Nombre del cliente" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Correo</span>
                  <input name="email" type="email" required className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Teléfono</span>
                  <input name="phone" className={inputClass} placeholder="+1 (305) 555-0123" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Modalidad</span>
                  <select name="modality" defaultValue="Online" className={inputClass}>
                    <option value="Online">Online</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Motivo</span>
                <textarea name="reason" rows={3} className={inputClass} placeholder="Opcional" />
              </label>

              <p className="text-xs leading-relaxed text-muted">
                Si el correo no tiene cuenta, se crea una para que la cita quede en su historial. La cita
                queda confirmada.
              </p>

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
              >
                {pending ? "Agendando…" : "Agendar cita"}
              </button>
            </form>
          ) : (
            <form
              action={(fd) => run(createBlackoutAction, fd, () => setSlot(null))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Desde</span>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(slot.start)}
                    required
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Hasta</span>
                  <input
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(slot.end)}
                    required
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Motivo</span>
                <input name="reason" className={inputClass} placeholder="Vacaciones, personal, viaje…" />
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="allDay" className="h-4 w-4 accent-[#6E8B74]" />
                Marcar como día completo en el calendario
              </label>

              <p className="text-xs leading-relaxed text-muted">
                Los horarios bloqueados dejan de ofrecerse en la agenda pública.
              </p>

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
              >
                {pending ? "Bloqueando…" : "Bloquear horario"}
              </button>
            </form>
          )}
        </Modal>
      ) : null}
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="card-soft my-auto w-full max-w-lg p-7"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-ink/40 hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

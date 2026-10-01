import { db } from "./db";
import { getConfig, horarioEnPalabras, rangosCalendario } from "./config";

/**
 * Agenda de Karen. El horario sale de /admin/configuracion (bloques que
 * empiezan a la hora en punto) y cada cita ocupa lo que dura su servicio:
 * una mentoría de 75 minutos a las 10:00 también tapa el bloque de las 11:00.
 * Un bloque deja de ofrecerse si choca con una cita activa o con un bloqueo.
 *
 * Las fechas se arman con la hora local del proceso, que en el VPS es
 * America/New_York (TZ del ecosistema PM2; ver src/lib/timezone.ts).
 */

const ACTIVAS = ["PENDIENTE", "CONFIRMADA"];
const MIN = 60 * 1000;
/** La sesión más larga posible: sirve para acotar la búsqueda de choques. */
const MAX_DURACION_MIN = 8 * 60;

/** Ventana que dibuja el calendario del panel, un poco más ancha que la de atención. */
export const CALENDAR_WINDOW = { min: "07:00:00", max: "22:00:00" };

export async function businessHoursLabel(locale: "es" | "en" = "es") {
  const { semana } = await getConfig();
  return horarioEnPalabras(semana, locale);
}

/** Horario de atención en el formato que entiende FullCalendar. */
export async function businessHoursRanges() {
  const { semana } = await getConfig();
  return rangosCalendario(semana);
}

/** "2026-09-15" → Date local a las 00:00. Rechaza fechas imposibles (31-feb). */
export function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function toISODay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function slotsForDay(day: Date) {
  const { semana } = await getConfig();
  return semana[day.getDay()] ?? [];
}

/**
 * ¿Una cita de `duracionMin` que empieza en `inicio` choca con algo?
 * Devuelve qué la bloquea, o null si el hueco está libre.
 */
export async function conflicto(
  inicio: Date,
  duracionMin: number,
  excluirId?: string,
): Promise<"cita" | "bloqueo" | null> {
  const fin = new Date(inicio.getTime() + duracionMin * MIN);

  const [citas, bloqueo] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: ACTIVAS },
        startsAt: { lt: fin, gt: new Date(inicio.getTime() - MAX_DURACION_MIN * MIN) },
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { startsAt: true, service: { select: { durationMin: true } } },
    }),
    db.blackout.findFirst({
      where: { startsAt: { lt: fin }, endsAt: { gt: inicio } },
      select: { id: true },
    }),
  ]);

  const chocaCita = citas.some((c) => {
    const finCita = new Date(c.startsAt.getTime() + c.service.durationMin * MIN);
    return c.startsAt < fin && finCita > inicio;
  });

  if (chocaCita) return "cita";
  if (bloqueo) return "bloqueo";
  return null;
}

export async function availableSlots(isoDay: string, duracionMin = 60) {
  const day = parseDay(isoDay);
  if (!day) return [];

  const hours = await slotsForDay(day);
  if (hours.length === 0) return [];

  const next = new Date(day);
  next.setDate(next.getDate() + 1);
  const duracion = Math.max(15, Math.min(duracionMin, MAX_DURACION_MIN));

  const [citas, blackouts] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: ACTIVAS },
        startsAt: { lt: new Date(next.getTime() + MAX_DURACION_MIN * MIN), gt: new Date(day.getTime() - MAX_DURACION_MIN * MIN) },
      },
      select: { startsAt: true, service: { select: { durationMin: true } } },
    }),
    db.blackout.findMany({
      where: { startsAt: { lt: new Date(next.getTime() + MAX_DURACION_MIN * MIN) }, endsAt: { gt: day } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const ocupado = citas.map((c) => ({
    desde: c.startsAt.getTime(),
    hasta: c.startsAt.getTime() + c.service.durationMin * MIN,
  }));
  const now = Date.now();

  return hours
    .map((h) => {
      const at = new Date(day);
      at.setHours(h, 0, 0, 0);
      return { hour: h, desde: at.getTime(), hasta: at.getTime() + duracion * MIN };
    })
    .filter((slot) => {
      if (slot.desde <= now) return false;
      if (ocupado.some((o) => o.desde < slot.hasta && o.hasta > slot.desde)) return false;
      return !blackouts.some((b) => b.startsAt.getTime() < slot.hasta && b.endsAt.getTime() > slot.desde);
    })
    .map((slot) => ({ hour: slot.hour, label: `${String(slot.hour).padStart(2, "0")}:00` }));
}

/** Próximos días para elegir en la agenda; los que no tienen horario salen cerrados. */
export async function upcomingDays(count = 14, locale: "es" | "en" = "es") {
  const { semana } = await getConfig();
  const intl = locale === "en" ? "en-US" : "es-US";
  const out: { iso: string; label: string; weekday: string; open: boolean }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (out.length < count) {
    out.push({
      iso: toISODay(cursor),
      label: cursor.toLocaleDateString(intl, { month: "short", day: "numeric" }),
      weekday: cursor.toLocaleDateString(intl, { weekday: "short" }),
      open: (semana[cursor.getDay()] ?? []).length > 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
}

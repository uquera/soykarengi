import { db } from "./db";

/**
 * Agenda de Karen. Bloques de una hora, lunes a viernes 10:00–19:00 y
 * sábado 10:00–14:00. Domingo cerrado. Un bloque ocupado por una cita
 * activa deja de ofrecerse.
 */
const WEEK = [
  [], // domingo
  [10, 11, 12, 15, 16, 17, 18], // lunes
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17],
  [10, 11, 12, 13], // sábado
];

export function businessHoursLabel(locale: "es" | "en" = "es") {
  return locale === "en"
    ? "Mon to Fri 10:00–19:00 · Sat 10:00–14:00"
    : "Lun a Vie 10:00–19:00 · Sáb 10:00–14:00";
}

/** "2026-09-15" → Date local a las 00:00, sin sorpresas de zona horaria. */
export function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function slotsForDay(day: Date) {
  return WEEK[day.getDay()] ?? [];
}

export async function availableSlots(isoDay: string) {
  const day = parseDay(isoDay);
  if (!day) return [];

  const hours = slotsForDay(day);
  if (hours.length === 0) return [];

  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  const taken = await db.appointment.findMany({
    where: {
      startsAt: { gte: day, lt: next },
      status: { in: ["PENDIENTE", "CONFIRMADA"] },
    },
    select: { startsAt: true },
  });

  const takenHours = new Set(taken.map((a) => new Date(a.startsAt).getHours()));
  const now = new Date();

  return hours
    .map((h) => {
      const at = new Date(day);
      at.setHours(h, 0, 0, 0);
      return { hour: h, at, label: `${String(h).padStart(2, "0")}:00` };
    })
    .filter((slot) => !takenHours.has(slot.hour) && slot.at > now)
    .map((slot) => ({ hour: slot.hour, label: slot.label }));
}

/** Próximos días con al menos un bloque libre, para sugerir en la agenda. */
export function upcomingDays(count = 14, locale: "es" | "en" = "es") {
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
      open: slotsForDay(cursor).length > 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
}

import { BUSINESS_TZ } from "./timezone";

/**
 * Vocabulario del panel sencillo. Karen no necesita los 8 estados internos de
 * un pedido: ve cuatro, y en cada uno hay un solo botón que la hace avanzar.
 */

export type PasoPedido = "NUEVO" | "ESPERANDO" | "PREPARANDO" | "ENTREGADO" | "CANCELADO";

export function pasoPedido(status: string): PasoPedido {
  if (status === "SOLICITUD") return "NUEVO";
  if (status === "COTIZADA" || status === "APROBADA") return "ESPERANDO";
  if (status === "ENTREGADA") return "ENTREGADO";
  if (status === "CANCELADA") return "CANCELADO";
  return "PREPARANDO"; // PAGADA, EN_DISENO, REVISION, APROBACION_FINAL
}

export const PASO_LABEL: Record<PasoPedido, string> = {
  NUEVO: "Nuevo",
  ESPERANDO: "Esperando respuesta",
  PREPARANDO: "En preparación",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/** Detalle de «esperando»: ¿esperamos a la clienta o esperamos el pago? */
export function detalleEspera(status: string) {
  if (status === "COTIZADA") return "Le enviaste el precio. Esperando que lo apruebe.";
  if (status === "APROBADA") return "Aprobó el precio. Cuando te pague, márcalo aquí.";
  return "";
}

// ─── Fechas en lenguaje natural, en la hora de Karen ─────────────────────────

const partes = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );

/** "2026-10-07" en la zona de Karen. */
export function diaKaren(d: Date) {
  const p = partes(d);
  return `${p.year}-${p.month}-${p.day}`;
}

function diferenciaDias(d: Date, ahora = new Date()) {
  const a = Date.parse(`${diaKaren(d)}T00:00:00Z`);
  const b = Date.parse(`${diaKaren(ahora)}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

export function hora(d: Date) {
  return d.toLocaleTimeString("es-US", { timeZone: BUSINESS_TZ, hour: "numeric", minute: "2-digit" });
}

/** «Hoy», «Mañana», «Ayer» o «martes 7 de octubre». */
export function diaHumano(d: Date) {
  const dif = diferenciaDias(d);
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Mañana";
  if (dif === -1) return "Ayer";
  const texto = d.toLocaleDateString("es-US", { timeZone: BUSINESS_TZ, weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** «Hoy a las 10:00 a. m.», «Martes 7 de octubre a las 3:00 p. m.» */
export function cuandoHumano(d: Date) {
  return `${diaHumano(d)} a las ${hora(d)}`;
}

/** Grupo de la agenda en lista. */
export function grupoAgenda(d: Date): "Hoy" | "Mañana" | "Esta semana" | "Más adelante" {
  const dif = diferenciaDias(d);
  if (dif <= 0) return "Hoy";
  if (dif === 1) return "Mañana";
  if (dif <= 7) return "Esta semana";
  return "Más adelante";
}

export function saludo(ahora = new Date()) {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, hour: "numeric", hourCycle: "h23" }).format(ahora),
  );
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function fechaLargaHoy(ahora = new Date()) {
  const t = ahora.toLocaleDateString("es-US", { timeZone: BUSINESS_TZ, weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Primer nombre, para que las tarjetas hablen de personas. */
export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;

/** Número de WhatsApp limpio para wa.me, o null. */
export function whatsappDe(telefono?: string | null) {
  const n = (telefono ?? "").replace(/\D/g, "");
  return n.length >= 8 ? n : null;
}

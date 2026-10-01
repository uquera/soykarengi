import { BUSINESS_TZ } from "./lib/timezone";

/**
 * Comprobación al arrancar. La agenda arma las fechas con la hora local del
 * proceso, que tiene que ser la de Karen (PM2 arranca con TZ=America/New_York).
 * Si alguien reinicia la app sin esa variable, los horarios saldrían corridos
 * sin ningún aviso; así al menos queda escrito en el log de PM2.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zona !== BUSINESS_TZ) {
    console.error(
      `[agenda] La zona horaria del proceso es ${zona} y debería ser ${BUSINESS_TZ}. ` +
        `Arranca la app con TZ=${BUSINESS_TZ} o los horarios se verán corridos.`,
    );
  }
}

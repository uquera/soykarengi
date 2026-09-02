/**
 * Karen atiende desde Estados Unidos. Toda la agenda —bloques, reservas y lo que
 * se muestra en pantalla— vive en esta zona horaria, sin importar dónde esté el
 * servidor ni desde dónde mire el cliente. El proceso de Node arranca con
 * TZ=America/New_York, así que en el servidor "las 11:00" ya son las de Karen.
 */
export const BUSINESS_TZ = "America/New_York";

export function timezoneLabel(locale: "es" | "en" = "es") {
  return locale === "en" ? "Eastern Time (US)" : "hora del Este (EE. UU.)";
}

export type FmtLocale = "es" | "en";

const intl = (locale: FmtLocale) => (locale === "en" ? "en-US" : "es-US");

/** Karen atiende desde Estados Unidos: todo se cotiza y se cobra en dólares. */
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function money(value: number | null | undefined, locale: FmtLocale = "es") {
  if (value === null || value === undefined) {
    return locale === "en" ? "To be quoted" : "Por cotizar";
  }
  return usd.format(value);
}

export function longDate(value: Date | string, locale: FmtLocale = "es") {
  return new Date(value).toLocaleDateString(intl(locale), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function shortDate(value: Date | string, locale: FmtLocale = "es") {
  return new Date(value).toLocaleDateString(intl(locale), {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function time(value: Date | string, locale: FmtLocale = "es") {
  return new Date(value).toLocaleTimeString(intl(locale), { hour: "numeric", minute: "2-digit" });
}

export function dateTime(value: Date | string, locale: FmtLocale = "es") {
  return `${shortDate(value, locale)} · ${time(value, locale)}`;
}

export function duration(minutes: number, locale: FmtLocale = "es") {
  const min = locale === "en" ? "min" : "min";
  const hr = locale === "en" ? "h" : "h";
  if (minutes < 60) return `${minutes} ${min}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ${hr} ${m} ${min}` : `${h} ${hr}`;
}

/** Código legible para citas y solicitudes: CITA-8F3D2 */
export function makeCode(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${rand}`;
}

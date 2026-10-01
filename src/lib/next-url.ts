/**
 * El `?next=` del login solo puede llevar a una ruta de este mismo sitio.
 * Comprobar que empiece con "/" no basta: "/\evil.com" el navegador lo
 * interpreta como "//evil.com", otro dominio. Por eso se resuelve como URL y
 * se exige que el origen no cambie.
 */
export function rutaInterna(valor: unknown): string {
  if (typeof valor !== "string" || !valor.startsWith("/")) return "";
  try {
    const base = "https://soykarengi.local";
    const url = new URL(valor, base);
    if (url.origin !== base) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

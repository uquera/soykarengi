import { cookies } from "next/headers";

/**
 * Karen trabaja dos unidades muy distintas y quiere saber a cuál viene cada
 * persona desde el primer clic. La puerta de la portada guarda esa elección
 * aquí; es una preferencia de navegación, no un candado: la otra unidad sigue
 * a un clic en todo el sitio.
 */

export const UNIDAD_COOKIE = "karengi_unidad";

export type Unidad = "acompanamiento" | "disenos";

/** Lo que la persona declara al crear su cuenta. */
export const INTERESES = ["ACOMPANAMIENTO", "DISENOS", "AMBAS"] as const;
export type Interes = (typeof INTERESES)[number];

export const INTERES_LABEL: Record<Interes, string> = {
  ACOMPANAMIENTO: "Dijo: acompañamiento",
  DISENOS: "Dijo: diseños",
  AMBAS: "Dijo: las dos",
};

export function parseUnidad(valor: unknown): Unidad | null {
  return valor === "acompanamiento" || valor === "disenos" ? valor : null;
}

export function parseInteres(valor: unknown): Interes | null {
  return INTERESES.includes(valor as Interes) ? (valor as Interes) : null;
}

export async function getUnidad(): Promise<Unidad | null> {
  const store = await cookies();
  return parseUnidad(store.get(UNIDAD_COOKIE)?.value);
}

/** La puerta elegida sugiere el interés del registro, y se puede cambiar ahí. */
export function interesDesdeUnidad(unidad: Unidad | null): Interes {
  if (unidad === "acompanamiento") return "ACOMPANAMIENTO";
  if (unidad === "disenos") return "DISENOS";
  return "AMBAS";
}

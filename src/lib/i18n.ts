import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { es } from "./dictionaries/es";
import { en } from "./dictionaries/en";

export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];
export const LOCALE_COOKIE = "karengi_lang";

/** El español es el idioma de origen: si falta una traducción, se cae hacia él. */
export type Dict = typeof es;

const DICTS: Record<Locale, Dict> = { es, en: en as Dict };

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "es";
});

export const getDict = cache(async (): Promise<Dict> => DICTS[await getLocale()]);

/** Contenido de base de datos: el campo en inglés es opcional y cae al español. */
export function pick(locale: Locale, spanish: string, english?: string | null): string {
  if (locale === "en" && english && english.trim() !== "") return english;
  return spanish;
}

export function intlLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "es-US";
}

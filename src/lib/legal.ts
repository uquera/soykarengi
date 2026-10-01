import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { CONSENTIMIENTO, PRIVACIDAD, TERMINOS } from "./legal-defaults";

/**
 * Documentos legales con versiones. Publicar un cambio crea una versión nueva
 * y deja las anteriores intactas: una aceptación apunta a la versión exacta
 * que se aceptó, con fecha, IP y navegador.
 */

export const TIPOS_LEGALES = ["PRIVACIDAD", "TERMINOS", "CONSENTIMIENTO"] as const;
export type TipoLegal = (typeof TIPOS_LEGALES)[number];

export const LEGAL_META: Record<TipoLegal, { titulo: string; ruta: string; corto: string }> = {
  PRIVACIDAD: { titulo: "Política de privacidad", ruta: "/privacidad", corto: "Privacidad" },
  TERMINOS: { titulo: "Términos y condiciones", ruta: "/terminos", corto: "Términos" },
  CONSENTIMIENTO: { titulo: "Consentimiento informado", ruta: "/consentimiento", corto: "Consentimiento" },
};

const TEXTOS_INICIALES: Record<TipoLegal, string> = { PRIVACIDAD, TERMINOS, CONSENTIMIENTO };

export function esTipoLegal(valor: string): valor is TipoLegal {
  return (TIPOS_LEGALES as readonly string[]).includes(valor);
}

/** La versión vigente. Si todavía no existe ninguna, publica la versión 1. */
export async function documentoVigente(tipo: TipoLegal) {
  const vigente = await db.documentoLegal.findFirst({ where: { tipo }, orderBy: { version: "desc" } });
  if (vigente) return vigente;

  try {
    return await db.documentoLegal.create({
      data: { tipo, version: 1, titulo: LEGAL_META[tipo].titulo, contenido: TEXTOS_INICIALES[tipo] },
    });
  } catch {
    // Otra petición la creó al mismo tiempo (la clave única tipo+versión lo impide dos veces).
    return db.documentoLegal.findFirstOrThrow({ where: { tipo }, orderBy: { version: "desc" } });
  }
}

/** ¿Esta persona ya aceptó la versión vigente de este documento? */
export async function aceptoVigente(userId: string, tipo: TipoLegal) {
  const doc = await documentoVigente(tipo);
  const aceptacion = await db.aceptacion.findUnique({
    where: { userId_documentoId: { userId, documentoId: doc.id } },
  });
  return { doc, aceptada: Boolean(aceptacion), aceptacion };
}

/** Registra la aceptación de unas versiones concretas, con fecha, IP y navegador. */
export async function registrarAceptaciones(userId: string, documentoIds: string[]) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null;
  const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;

  for (const documentoId of documentoIds) {
    await db.aceptacion.upsert({
      where: { userId_documentoId: { userId, documentoId } },
      update: {},
      create: { userId, documentoId, ip, userAgent },
    });
  }
}

/** Un párrafo por línea; «## » abre un subtítulo. Lo mismo que usa el blog. */
export function bloquesLegales(contenido: string) {
  return contenido
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) =>
      linea.startsWith("## ")
        ? { tipo: "titulo" as const, texto: linea.slice(3).trim() }
        : { tipo: "parrafo" as const, texto: linea },
    );
}

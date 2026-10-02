import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

/**
 * Enlaces de acción para los correos de Karen («Confirmar cita»). El enlace
 * lleva un token de un solo uso; la base guarda solo su huella. Abrirlo no
 * hace nada por sí solo: muestra la cita y un botón «Sí, confirmar».
 */

const APP_URL = process.env.APP_URL ?? "https://karengi.srv1485601.hstgr.cloud";
const VIGENCIA_DIAS = 14;

export type TipoAccion = "CONFIRMAR_CITA";

const huella = (token: string) => createHash("sha256").update(token).digest("hex");

export async function enlaceAccion(tipo: TipoAccion, refId: string) {
  const token = randomBytes(24).toString("base64url");
  await db.accionCorreo.create({
    data: { hash: huella(token), tipo, refId, expiresAt: new Date(Date.now() + VIGENCIA_DIAS * 86_400_000) },
  });
  return `${APP_URL}/accion/${token}`;
}

/** La acción si sirve todavía; null si no existe, venció o ya se usó. */
export async function accionValida(token: string) {
  if (!token || token.length < 20) return null;
  const accion = await db.accionCorreo.findUnique({ where: { hash: huella(token) } });
  if (!accion || accion.usedAt || accion.expiresAt < new Date()) return null;
  return accion;
}

/** La acción aunque ya se haya usado: para mostrar «ya está confirmada» y no un error. */
export async function buscarAccion(token: string) {
  if (!token || token.length < 20) return null;
  return db.accionCorreo.findUnique({ where: { hash: huella(token) } });
}

export async function consumirAccion(id: string) {
  await db.accionCorreo.update({ where: { id }, data: { usedAt: new Date() } });
}

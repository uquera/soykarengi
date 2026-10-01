import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { correoActivacion, correoRecuperacion } from "./email";

/**
 * Enlaces de un solo uso para elegir contraseña.
 *   RECUPERAR  «¿Olvidaste tu contraseña?», vence en 1 hora.
 *   ACTIVAR    cuentas que crea Karen al agendar a alguien, vence en 7 días.
 * Pedir uno nuevo invalida los anteriores de esa persona.
 */

const APP_URL = process.env.APP_URL ?? "https://karengi.srv1485601.hstgr.cloud";
const VIGENCIA_HORAS = { RECUPERAR: 1, ACTIVAR: 24 * 7 } as const;
type Proposito = keyof typeof VIGENCIA_HORAS;

const huella = (token: string) => createHash("sha256").update(token).digest("hex");

async function crearToken(userId: string, proposito: Proposito) {
  await db.tokenClave.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });

  const token = randomBytes(32).toString("base64url");
  await db.tokenClave.create({
    data: {
      userId,
      hash: huella(token),
      proposito,
      expiresAt: new Date(Date.now() + VIGENCIA_HORAS[proposito] * 3_600_000),
    },
  });
  return `${APP_URL}/restablecer-clave?token=${token}`;
}

export async function enviarRecuperacion(user: { id: string; email: string; name: string }) {
  const enlace = await crearToken(user.id, "RECUPERAR");
  return correoRecuperacion(user.email, user.name, enlace);
}

export async function enviarActivacion(user: { id: string; email: string; name: string }) {
  const enlace = await crearToken(user.id, "ACTIVAR");
  return correoActivacion(user.email, user.name, enlace);
}

/** El registro del token si sirve todavía; null si no existe, venció o ya se usó. */
export async function tokenValido(token: string) {
  if (!token || token.length < 20) return null;
  const registro = await db.tokenClave.findUnique({ where: { hash: huella(token) }, include: { user: true } });
  if (!registro || registro.usedAt || registro.expiresAt < new Date()) return null;
  return registro;
}

export async function consumirToken(id: string) {
  await db.tokenClave.update({ where: { id }, data: { usedAt: new Date() } });
}

// ─── Límite de intentos ───────────────────────────────────────────────────────

/**
 * Freno simple contra fuerza bruta: en memoria, porque la app corre en un
 * solo proceso. Se pierde al reiniciar, lo que está bien para este uso.
 */
const intentos = new Map<string, number[]>();

export function demasiadosIntentos(clave: string, maximo: number, ventanaMin: number) {
  const ahora = Date.now();
  const desde = ahora - ventanaMin * 60_000;
  const recientes = (intentos.get(clave) ?? []).filter((t) => t > desde);
  recientes.push(ahora);
  intentos.set(clave, recientes);
  if (intentos.size > 5000) intentos.clear();
  return recientes.length > maximo;
}

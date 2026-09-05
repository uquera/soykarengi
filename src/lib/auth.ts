import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { getLicenciaStatus } from "./licencia";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.uid } });
});

/**
 * Corte por licencia. Vive aquí, y no solo en los layouts, porque un layout que
 * devuelve otra cosa no impide que la página hija se renderice: sus consultas
 * corren igual y su resultado viaja en el payload. Toda página privada llama a
 * `requireUser` o `requireAdmin` antes de consultar nada, así que este es el
 * punto donde el corte ocurre de verdad.
 *
 * /admin/licencia queda fuera: es la pantalla que explica el corte.
 */
async function requireLicencia() {
  const licencia = await getLicenciaStatus();
  if (!licencia.bloqueada) return;

  const ruta = (await headers()).get("x-pathname") ?? "";
  if (ruta.startsWith("/admin/licencia")) return;

  redirect("/suspendido");
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mi-espacio");
  await requireLicencia();
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/admin");
  if (user.role !== "ADMIN") redirect("/mi-espacio");
  await requireLicencia();
  return user;
}

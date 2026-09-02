import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
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

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mi-espacio");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/admin");
  if (user.role !== "ADMIN") redirect("/mi-espacio");
  return user;
}

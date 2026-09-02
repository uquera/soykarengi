"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, cookieOptions, signSession } from "@/lib/session";

export type FormState = { error?: string; ok?: boolean };

const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo."),
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "La contraseña necesita al menos 6 caracteres."),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

async function startSession(user: { id: string; email: string; name: string; role: string }) {
  const token = await signSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "CLIENT",
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions);
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con este correo. Puedes ingresar." };

  const user = await db.user.create({
    data: { name, email, phone: phone || null, passwordHash: await bcrypt.hash(password, 10) },
  });

  await startSession(user);
  redirect(safeNext(formData.get("next")) || "/mi-espacio");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await startSession(user);
  redirect(safeNext(formData.get("next")) || (user.role === "ADMIN" ? "/admin" : "/mi-espacio"));
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Escribe tu nombre completo." };

  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
    },
  });

  // El nombre vive también en el token de sesión: hay que refrescarlo.
  await startSession({ ...user, name });
  return { ok: true };
}

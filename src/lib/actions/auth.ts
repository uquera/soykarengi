"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE, cookieOptions, signSession } from "@/lib/session";
import { rutaInterna } from "@/lib/next-url";
import { documentoVigente, registrarAceptaciones } from "@/lib/legal";
import { consumirToken, demasiadosIntentos, enviarRecuperacion, tokenValido } from "@/lib/password-reset";

export type FormState = { error?: string; ok?: boolean };

const MIN_CLAVE = 8;
const claveSchema = z.string().min(MIN_CLAVE, `La contraseña necesita al menos ${MIN_CLAVE} caracteres.`).max(200);

const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo.").max(120),
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  phone: z.string().trim().max(40).optional(),
  password: claveSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

async function ipCliente() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
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

const destinoPorRol = (role: string) => (role === "ADMIN" ? "/admin" : "/mi-espacio");

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (demasiadosIntentos(`registro:${await ipCliente()}`, 10, 60)) {
    return { error: "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (formData.get("aceptaLegales") !== "si") {
    return { error: "Para crear tu cuenta necesitas aceptar la política de privacidad y los términos." };
  }

  const { name, email, phone, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con este correo. Puedes ingresar o recuperar tu contraseña." };

  const { parseInteres } = await import("@/lib/unidad");
  const user = await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      interest: parseInteres(formData.get("interest")),
    },
  });

  // Se registra qué versión exacta de cada documento aceptó, con fecha e IP.
  const [privacidad, terminos] = await Promise.all([documentoVigente("PRIVACIDAD"), documentoVigente("TERMINOS")]);
  await registrarAceptaciones(user.id, [privacidad.id, terminos.id]);

  // Antes del redirect, que lanza y corta el resto de la acción.
  const { correoBienvenida } = await import("@/lib/email");
  await correoBienvenida(user.email, user.name);

  await startSession(user);
  redirect(rutaInterna(formData.get("next")) || "/mi-espacio");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  // Freno contra fuerza bruta: por correo y por IP.
  const ip = await ipCliente();
  if (demasiadosIntentos(`login:${email}`, 8, 15) || demasiadosIntentos(`login-ip:${ip}`, 30, 15)) {
    return { error: "Demasiados intentos. Espera 15 minutos o recupera tu contraseña." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await startSession(user);
  redirect(rutaInterna(formData.get("next")) || destinoPorRol(user.role));
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
      name: name.slice(0, 120),
      phone: String(formData.get("phone") ?? "").trim().slice(0, 40) || null,
      city: String(formData.get("city") ?? "").trim().slice(0, 80) || null,
    },
  });

  // El nombre vive también en el token de sesión: hay que refrescarlo.
  await startSession({ ...user, name });
  return { ok: true };
}

export async function cambiarClaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró." };

  if (demasiadosIntentos(`cambio:${user.id}`, 8, 15)) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }

  const actual = String(formData.get("actual") ?? "");
  const nueva = claveSchema.safeParse(String(formData.get("nueva") ?? ""));
  if (!nueva.success) return { error: nueva.error.issues[0].message };
  if (nueva.data !== String(formData.get("confirmar") ?? "")) return { error: "Las contraseñas nuevas no coinciden." };
  if (!(await bcrypt.compare(actual, user.passwordHash))) return { error: "Tu contraseña actual no es correcta." };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(nueva.data, 10) } });
  return { ok: true };
}

/** «¿Olvidaste tu contraseña?». Responde igual exista o no la cuenta. */
export async function solicitarRecuperacionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Revisa tu correo." };

  const ip = await ipCliente();
  if (demasiadosIntentos(`recuperar:${ip}`, 5, 15) || demasiadosIntentos(`recuperar:${email}`, 3, 15)) {
    return { error: "Ya pediste varios enlaces. Revisa tu correo (también spam) o espera unos minutos." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user) await enviarRecuperacion(user);
  return { ok: true };
}

export async function restablecerClaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (demasiadosIntentos(`restablecer:${await ipCliente()}`, 10, 15)) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }

  const registro = await tokenValido(String(formData.get("token") ?? ""));
  if (!registro) return { error: "El enlace venció o ya se usó. Pide uno nuevo." };

  const nueva = claveSchema.safeParse(String(formData.get("nueva") ?? ""));
  if (!nueva.success) return { error: nueva.error.issues[0].message };
  if (nueva.data !== String(formData.get("confirmar") ?? "")) return { error: "Las contraseñas no coinciden." };

  await db.user.update({
    where: { id: registro.userId },
    data: { passwordHash: await bcrypt.hash(nueva.data, 10) },
  });
  await consumirToken(registro.id);

  await startSession(registro.user);
  redirect(destinoPorRol(registro.user.role));
}

/** Aviso de Mi espacio cuando Karen publica una versión nueva de privacidad o términos. */
export async function aceptarLegalesAction(): Promise<FormState> {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró." };

  const [privacidad, terminos] = await Promise.all([documentoVigente("PRIVACIDAD"), documentoVigente("TERMINOS")]);
  await registrarAceptaciones(user.id, [privacidad.id, terminos.id]);
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}

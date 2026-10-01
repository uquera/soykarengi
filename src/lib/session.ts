import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
  role: "CLIENT" | "ADMIN";
};

export const SESSION_COOKIE = "karengi_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/**
 * En producción no hay valor por defecto: si AUTH_SECRET falta o es corto, la
 * app falla al firmar en vez de usar un secreto que está escrito en el repo
 * (con él cualquiera podría fabricarse una sesión de administradora).
 */
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET falta o tiene menos de 32 caracteres.");
    }
    return new TextEncoder().encode("karengi-solo-para-desarrollo-local-no-usar-en-produccion");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};

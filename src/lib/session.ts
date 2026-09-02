import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
  role: "CLIENT" | "ADMIN";
};

export const SESSION_COOKIE = "karengi_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secret() {
  const value = process.env.AUTH_SECRET || "karengi-desarrollo-secreto-cambiar-en-produccion";
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

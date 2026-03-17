import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";

export type AdminRole =
  | "admin"
  | "ventas"
  | "operaciones"
  | "rrhh"
  | "contabilidad";

export type AdminSession = {
  userId: string;
  email: string;
  nombre: string;
  role: AdminRole;
};

export function hasAnyRole(
  session: Pick<AdminSession, "role"> | null,
  roles: AdminRole[]
) {
  return Boolean(session && roles.includes(session.role));
}

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET o ADMIN_PASSWORD no está definido");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(session: AdminSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function verifyAdminSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromRequest(req: NextRequest) {
  return verifyAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function hashAdminPassword(password: string) {
  return hash(password, 10);
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

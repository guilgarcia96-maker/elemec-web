import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  ADMIN_SESSION_COOKIE,
  hashAdminPassword,
  signAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, email, nombre, role, activo, password_hash")
    .eq("email", email)
    .maybeSingle();

  let sessionData;

  if (adminUser?.activo && adminUser.password_hash) {
    const isValidPassword = await verifyAdminPassword(password, adminUser.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    sessionData = {
      userId: adminUser.id,
      email: adminUser.email,
      nombre: adminUser.nombre,
      role: adminUser.role,
    };
  } else {
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    sessionData = {
      userId: "legacy-admin",
      email,
      nombre: "Administrador",
      role: "admin" as const,
    };

    const passwordHash = await hashAdminPassword(password);
    await supabase.from("admin_users").upsert(
      [{
        email,
        nombre: "Administrador",
        role: "admin",
        activo: true,
        password_hash: passwordHash,
      }],
      { onConflict: "email" }
    );
  }

  const token = await signAdminSession(sessionData);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}

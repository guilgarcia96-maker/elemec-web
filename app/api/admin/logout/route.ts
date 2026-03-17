import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"));
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}

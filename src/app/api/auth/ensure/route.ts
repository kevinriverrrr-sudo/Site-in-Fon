import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { UID_COOKIE } from "@/lib/auth";

export async function GET() {
  const c = cookies();
  const existing = c.get(UID_COOKIE)?.value;
  if (existing) {
    return NextResponse.json({ userId: existing });
  }
  const uid = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}`;
  const res = NextResponse.json({ userId: uid });
  res.cookies.set(UID_COOKIE, uid, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}

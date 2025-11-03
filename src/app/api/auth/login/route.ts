import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name } = await req.json().catch(() => ({ name: "Гость" }));
  const uid = crypto.randomUUID();
  const res = NextResponse.json({ ok: true, user: { id: uid, name } });
  // Set cookies for a simple demo auth; not HttpOnly to allow client hints (demo only)
  res.cookies.set("uid", uid, { path: "/", httpOnly: false, sameSite: "lax" });
  res.cookies.set("uname", name || "Гость", { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}

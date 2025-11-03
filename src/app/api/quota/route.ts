import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { getRemainingQuota } from "@/lib/store";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const q = getRemainingQuota(userId);
  return NextResponse.json(q);
}

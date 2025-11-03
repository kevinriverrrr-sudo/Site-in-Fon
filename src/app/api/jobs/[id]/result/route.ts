import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { getJob } from "@/lib/store";

export async function GET(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = context.params.id;
  const job = getJob(userId, id);
  if (!job) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!job.resultBuffer) return NextResponse.json({ error: "not-ready" }, { status: 400 });
  const res = new NextResponse(job.resultBuffer, { status: 200 });
  res.headers.set("Content-Type", job.resultMimeType || "image/png");
  res.headers.set("Cache-Control", "private, max-age=300");
  return res;
}

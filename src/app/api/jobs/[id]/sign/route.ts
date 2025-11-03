import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { getJob } from "@/lib/store";
import { createSignedUrlToken } from "@/lib/store";
import { env } from "@/env";

export async function GET(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = context.params.id;
  const job = getJob(userId, id);
  if (!job) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (job.status !== "completed" || !job.resultBuffer) {
    return NextResponse.json({ error: "not-ready" }, { status: 400 });
  }
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const token = createSignedUrlToken({ jobId: job.id, userId, exp }, env.AUTH_SECRET);
  const url = new URL(req.url);
  const base = `${url.origin}/api/jobs/${job.id}/download`;
  const signedUrl = `${base}?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ url: signedUrl, exp });
}

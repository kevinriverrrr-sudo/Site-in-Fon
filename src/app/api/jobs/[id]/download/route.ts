import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { getJob, verifySignedUrlToken } from "@/lib/store";
import { env } from "@/env";

export async function GET(req: Request, context: { params: { id: string } }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  const { valid, payload } = verifySignedUrlToken(token, env.AUTH_SECRET);
  if (!valid || !payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { userId, jobId } = payload;
  const job = getJob(userId, jobId);
  if (!job || job.id !== context.params.id) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  if (!job.resultBuffer) return NextResponse.json({ error: "not-ready" }, { status: 400 });
  const res = new NextResponse(job.resultBuffer, {
    status: 200,
  });
  res.headers.set("Content-Type", job.resultMimeType || "image/png");
  res.headers.set(
    "Content-Disposition",
    `attachment; filename="${job.id}.png"`
  );
  return res;
}

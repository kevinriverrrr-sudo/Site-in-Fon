import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { createJob, getRemainingQuota, getUserJobs, DAILY_LIMIT } from "@/lib/store";

export async function GET() {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const jobs = getUserJobs(userId).map((j) => ({
    id: j.id,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    originalName: j.originalName,
    size: j.size,
  }));
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const quota = getRemainingQuota(userId);
  if (quota.remaining <= 0) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no-file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "unsupported" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const job = createJob({
    userId,
    originalName: file.name || "image.png",
    mimeType: file.type,
    size: file.size,
    buffer: buf,
  });
  return NextResponse.json({ id: job.id, limit: DAILY_LIMIT });
}

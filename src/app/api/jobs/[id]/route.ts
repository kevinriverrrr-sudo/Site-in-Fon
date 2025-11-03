import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { deleteJob, getJob } from "@/lib/store";

export async function GET(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = context.params.id;
  const job = getJob(userId, id);
  if (!job) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    originalName: job.originalName,
    size: job.size,
    hasResult: !!job.resultBuffer,
  });
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = context.params.id;
  const ok = deleteJob(userId, id);
  if (!ok) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

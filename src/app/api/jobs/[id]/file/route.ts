import { NextResponse } from "next/server";
import { getUserIdFromCookies } from "@/lib/auth";
import { getJob } from "@/lib/store";

export async function GET(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromCookies();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = context.params.id;
  const job = getJob(userId, id);
  if (!job) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const res = new NextResponse(job.originalBuffer, { status: 200 });
  res.headers.set("Content-Type", job.mimeType);
  res.headers.set("Cache-Control", "private, max-age=31536000");
  return res;
}

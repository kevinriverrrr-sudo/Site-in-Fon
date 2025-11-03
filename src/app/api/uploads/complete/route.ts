import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { addImageJob, ImageJob } from "@/lib/db";
import { randomUUID } from "crypto";

const schema = z.object({
  key: z.string().min(1),
  size: z.number().int().positive(),
  mime: z.string(),
});

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const rate = checkRateLimit(`upload-complete:${user.id}`, 60, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные параметры" }, { status: 400 });
  }
  const { key, size, mime } = parsed.data;

  if (!ALLOWED_MIME.includes(mime as any)) {
    return NextResponse.json({ error: "Неподдерживаемый тип файла" }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 15MB)" }, { status: 400 });
  }
  if (!key.startsWith(`originals/${user.id}/`)) {
    return NextResponse.json({ error: "Неверный ключ объекта" }, { status: 400 });
  }

  const job: ImageJob = {
    id: randomUUID(),
    userId: user.id,
    sourceKey: key,
    size,
    mime,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  await addImageJob(job);

  return NextResponse.json({ ok: true, job });
}

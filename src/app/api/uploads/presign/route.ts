import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, createPresignedPutUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { randomUUID } from "crypto";

const inputSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string(),
  size: z.number().int().positive(),
});

function getFileExt(name: string) {
  const idx = name.lastIndexOf(".");
  return idx !== -1 ? name.slice(idx + 1) : "";
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const rate = checkRateLimit(`presign:${user.id}`, 20, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные параметры" }, { status: 400 });
  }

  const { filename, contentType, size } = parsed.data;

  if (!ALLOWED_MIME.includes(contentType as any)) {
    return NextResponse.json({ error: "Неподдерживаемый тип файла" }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 15MB)" }, { status: 400 });
  }

  const ext = getFileExt(filename).toLowerCase();
  const base = safeName(filename.replace(/\.[^.]+$/, ""));
  const uuid = randomUUID();
  const key = `originals/${user.id}/${Date.now()}-${uuid}-${base}${ext ? "." + ext : ""}`;

  const uploadUrl = await createPresignedPutUrl({ key, contentType });

  return NextResponse.json({ uploadUrl, key });
}

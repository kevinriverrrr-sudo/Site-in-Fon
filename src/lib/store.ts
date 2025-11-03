import { createHash, timingSafeEqual, randomBytes } from "crypto";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ImageJob {
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  originalBuffer: Buffer;
  resultBuffer?: Buffer;
  resultMimeType?: string;
  error?: string;
}

export interface UsageLog {
  jobId: string;
  userId: string;
  timestamp: Date;
}

const jobs = new Map<string, ImageJob>();
const jobsByUser = new Map<string, string[]>();
const usageLogsByUser = new Map<string, UsageLog[]>();

export const DAILY_LIMIT = 30;

function now(): Date {
  return new Date();
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function getUserJobs(userId: string): ImageJob[] {
  const ids = jobsByUser.get(userId) ?? [];
  return ids.map((id) => jobs.get(id)!).filter(Boolean).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getJob(userId: string, jobId: string): ImageJob | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  if (job.userId !== userId) return undefined;
  return job;
}

export function getDailyJobCount(userId: string, date: Date = now()): number {
  return getUserJobs(userId).filter((j) => isSameUtcDay(j.createdAt, date)).length;
}

export function getDailyUsageCount(userId: string, date: Date = now()): number {
  const logs = usageLogsByUser.get(userId) ?? [];
  return logs.filter((l) => isSameUtcDay(l.timestamp, date)).length;
}

export function getRemainingQuota(userId: string): { used: number; remaining: number; limit: number } {
  const used = getDailyJobCount(userId);
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return { used, remaining, limit: DAILY_LIMIT };
}

function recordUsage(job: ImageJob) {
  const logs = usageLogsByUser.get(job.userId) ?? [];
  logs.push({ jobId: job.id, userId: job.userId, timestamp: now() });
  usageLogsByUser.set(job.userId, logs);
}

function processJobAsync(job: ImageJob) {
  // Simulate async processing pipeline
  setTimeout(() => {
    const current = jobs.get(job.id);
    if (!current) return;
    current.status = "processing";
    current.updatedAt = now();

    setTimeout(() => {
      const j = jobs.get(job.id);
      if (!j) return;
      try {
        // For MVP, just echo original buffer as result
        j.resultBuffer = Buffer.from(j.originalBuffer);
        j.resultMimeType = "image/png"; // pretend PNG
        j.status = "completed";
        j.updatedAt = now();
        recordUsage(j);
      } catch (e: any) {
        j.status = "failed";
        j.error = e?.message ?? "Processing failed";
        j.updatedAt = now();
      }
    }, 1200);
  }, 400);
}

export function createJob(params: {
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}): ImageJob {
  const id = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  const job: ImageJob = {
    id,
    userId: params.userId,
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.size,
    status: "queued",
    createdAt: now(),
    updatedAt: now(),
    originalBuffer: params.buffer,
  };
  jobs.set(id, job);
  const list = jobsByUser.get(params.userId) ?? [];
  list.unshift(id);
  jobsByUser.set(params.userId, list);

  processJobAsync(job);

  return job;
}

export function deleteJob(userId: string, jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return false;
  jobs.delete(jobId);
  const arr = jobsByUser.get(userId) ?? [];
  jobsByUser.set(userId, arr.filter((id) => id !== jobId));
  return true;
}

// Signing utilities for simple signed GET URLs
export function signToken(data: string, secret: string): string {
  const h = createHash("sha256");
  h.update(data + secret);
  return h.digest("hex");
}

export function createSignedUrlToken(payload: { jobId: string; userId: string; exp: number }, secret: string): string {
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signToken(base, secret);
  return `${base}.${sig}`;
}

export function verifySignedUrlToken(token: string, secret: string): { valid: boolean; payload?: { jobId: string; userId: string; exp: number } } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [base, sig] = parts;
  const expected = signToken(base, secret);
  try {
    const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return { valid: false };
  } catch {
    return { valid: false };
  }
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

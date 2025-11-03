type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true } as const;
  }
  if (bucket.count < limit) {
    bucket.count++;
    return { success: true } as const;
  }
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return { success: false, retryAfter } as const;
}

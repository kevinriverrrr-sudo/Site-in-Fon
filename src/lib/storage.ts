import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

let _s3: S3Client | null = null;

export function getS3Client() {
  if (_s3) return _s3;
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || "false").toLowerCase() === "true";
  _s3 = new S3Client({
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    endpoint,
    forcePathStyle,
  });
  return _s3;
}

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

export async function createPresignedPutUrl(opts: {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds
}) {
  const s3 = getS3Client();
  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: opts.expiresIn ?? 60 });
  return url;
}

export async function createPresignedGetUrl(opts: { key: string; expiresIn?: number }) {
  const s3 = getS3Client();
  const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: opts.key });
  const url = await getSignedUrl(s3, cmd, { expiresIn: opts.expiresIn ?? 60 });
  return url;
}

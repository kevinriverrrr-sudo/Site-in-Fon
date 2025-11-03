import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().default("postgresql://user:password@localhost:5432/mydb"),
    AUTH_SECRET: z.string().min(32).default("dev-secret-key-change-in-production-32-chars"),
    AUTH_TRUST_HOST: z.string().default("true"),
    SMTP_HOST: z.string().default("localhost"),
    SMTP_PORT: z.string().default("1025"),
    SMTP_USER: z.string().default("dev@example.com"),
    SMTP_PASSWORD: z.string().default("dev-password"),
    S3_BUCKET: z.string().default("dev-bucket"),
    S3_REGION: z.string().default("us-east-1"),
    S3_ACCESS_KEY_ID: z.string().default("dev-access-key"),
    S3_SECRET_ACCESS_KEY: z.string().default("dev-secret-key"),
    REDIS_URL: z.string().url().default("redis://localhost:6379"),
    API_KEY: z.string().default("dev-api-key-change-in-production"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  client: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: z.string(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    REDIS_URL: process.env.REDIS_URL,
    API_KEY: process.env.API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

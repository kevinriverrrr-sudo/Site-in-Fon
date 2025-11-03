import { env } from "@/env";

/**
 * Example usage of validated environment variables
 * This demonstrates that env validation is working
 */
export function getDatabaseConfig() {
  return {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production",
  };
}

export function getAuthConfig() {
  return {
    secret: env.AUTH_SECRET,
    trustHost: env.AUTH_TRUST_HOST,
  };
}

export function getSmtpConfig() {
  return {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  };
}

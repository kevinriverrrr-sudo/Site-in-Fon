import { cookies } from "next/headers";

export const UID_COOKIE = "uid";

export function getUserIdFromCookies(): string | null {
  try {
    const c = cookies();
    const v = c.get(UID_COOKIE)?.value;
    return v ?? null;
  } catch {
    return null;
  }
}

import { cookies } from "next/headers";

export type User = {
  id: string;
  name?: string;
};

export function getCurrentUser(): User | null {
  const store = cookies();
  const id = store.get("uid")?.value;
  const name = store.get("uname")?.value;
  if (!id) return null;
  return { id, name };
}

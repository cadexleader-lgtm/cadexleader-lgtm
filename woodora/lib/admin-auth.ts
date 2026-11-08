import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { readSessionToken, SESSION_COOKIE } from "./auth";
import { getUser, type User } from "./data/misc";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const session = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return getUser(session.uid);
});

/** Every admin page and server action calls this first. */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

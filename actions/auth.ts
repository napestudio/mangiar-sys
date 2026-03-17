"use server";

import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

/**
 * Invalidates all server-side permission caches for the current user.
 * Must be called before signOut() to ensure stale data is not served
 * to the next user who logs in.
 */
export async function invalidateUserCaches(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");
}

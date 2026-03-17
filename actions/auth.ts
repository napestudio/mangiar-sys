"use server";

import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

/**
 * Invalidates all server-side permission caches for the current user.
 * Called when permissions change (role updates, grant changes, etc.).
 */
export async function invalidateUserCaches(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");
}

"use server";

import { signOut, auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

/**
 * Clears server-side permission caches and signs out the user server-side.
 * Using server-side signOut ensures the session cookie is cleared with the
 * exact same domain/attributes as when it was created, which is critical
 * in production multi-subdomain deployments.
 */
export async function logoutAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.id) {
    revalidateTag("user-permissions");
    revalidateTag("user-permission-grants");
  }
  await signOut({ redirectTo: "/ingresar" });
}

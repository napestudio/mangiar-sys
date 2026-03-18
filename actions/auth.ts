"use server";

import { signOut, auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function invalidateUserCaches(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");
}

export async function logoutAction(): Promise<void> {
  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  await signOut({ redirectTo: `${protocol}://${rootDomain}/ingresar` });
}

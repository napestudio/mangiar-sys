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
  await signOut({ redirect: false });
}

"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function invalidateUserCaches(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");
  revalidateTag("user-role-and-branch");
}

export async function logoutAction(): Promise<void> {
  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const cookieStore = await cookies();
  cookieStore.set({
    name: cookieName,
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

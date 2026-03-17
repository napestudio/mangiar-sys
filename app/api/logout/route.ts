import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      revalidateTag("user-permissions");
      revalidateTag("user-permission-grants");
    }
  } catch {
    // If session reading fails, still proceed to delete the cookie
  }

  const response = NextResponse.redirect(new URL("/ingresar", request.url));

  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const cookieDomain = process.env.COOKIE_DOMAIN;

  // Delete the session cookie with the exact same attributes as lib/auth.ts
  response.cookies.set(cookieName, "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}

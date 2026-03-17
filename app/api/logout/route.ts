import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  revalidateTag("user-permissions");
  revalidateTag("user-permission-grants");

  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const sessionCookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const cookieParts = [
    `${sessionCookieName}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(useSecureCookies ? ["Secure"] : []),
    ...(cookieDomain ? [`Domain=${cookieDomain}`] : []),
  ];

  const headers = new Headers();
  headers.set("Location", new URL("/ingresar", request.url).toString());
  headers.set("Set-Cookie", cookieParts.join("; "));
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return new Response(null, { status: 302, headers });
}

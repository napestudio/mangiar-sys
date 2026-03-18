import { NextResponse } from "next/server";

const useSecureCookies = process.env.NODE_ENV === "production";
const cookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const cookieDomain = process.env.COOKIE_DOMAIN;

export async function GET() {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const protocol = root.startsWith("localhost") ? "http" : "https";

  const response = NextResponse.redirect(`${protocol}://${root}/ingresar`, {
    status: 302,
  });

  response.cookies.set({
    name: cookieName,
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}

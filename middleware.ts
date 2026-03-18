import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Subdomain extraction — runs for all matched routes
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0]; // Strip port if present
  const knownApexDomains = ["localhost", "mangi.ar", "www.mangi.ar"];
  const isApex = knownApexDomains.some((d) => hostname === d);
  const subdomain =
    !isApex && hostname.includes(".") ? hostname.split(".")[0] : null;

  // For local dev without a subdomain, fall back to BRANCH_ID env var
  const subdomainHeader = subdomain ?? process.env.BRANCH_SUBDOMAIN ?? "";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-subdomain", subdomainHeader);

  // Auth checks — only for routes that need them
  if (pathname === "/ingresar" || pathname.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const isLoggedIn = !!token;

    // Redirect logged-in users away from /ingresar to the post-login redirect handler.
    // Cache-Control: no-store prevents browsers/CDNs from caching this redirect decision,
    // which would cause stale redirects after logout.
    if (pathname === "/ingresar" && isLoggedIn) {
      const response = NextResponse.redirect(
        new URL("/api/auth-redirect", req.url)
      );
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      return response;
    }

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard") && !isLoggedIn) {
      const response = NextResponse.redirect(new URL("/ingresar", req.url));
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      return response;
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * Subdomain extraction runs on every request; auth checks only for /ingresar and /dashboard.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

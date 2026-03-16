import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Redirect logged-in users away from /login to the post-login callback
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/callback", req.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect the callback page — requires an authenticated session
  if (pathname === "/auth/callback" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Extract subdomain and forward it as a header for the public page
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

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * Auth checks and subdomain extraction run on every request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

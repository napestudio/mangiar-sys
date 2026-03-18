import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config — no Prisma, no bcrypt, no Node.js-only deps.
// Used by middleware.ts. The full config (with providers) lives in lib/auth.ts.

const useSecureCookies = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN;

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/ingresar" },
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
};

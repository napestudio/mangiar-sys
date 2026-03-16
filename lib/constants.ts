export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
export const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Builds a URL for a restaurant subdomain.
 * In development, returns a relative path since localhost doesn't support real subdomains.
 */
export function buildSubdomainUrl(slug: string, path = "/dashboard"): string {
  if (IS_DEV) return path;
  return `https://${slug}.${ROOT_DOMAIN}${path}`;
}

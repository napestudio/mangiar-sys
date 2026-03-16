/**
 * Generates a URL-safe slug from a restaurant name.
 * Removes accents, spaces, and all non-alphanumeric characters.
 *
 * Examples:
 *   "Burger Joint"        → "burgerjoint"
 *   "La Tortillería"      → "latortilleria"
 *   "Don Atilio & Sons!"  → "donatiliosons"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (accents)
    .replace(/[^a-z0-9]/g, ""); // strip everything non-alphanumeric
}

/**
 * Returns the admin login email for a given restaurant slug.
 * Example: slug "burgerjoint" → "admin@burgerjoint.com"
 */
export function buildAdminEmail(slug: string): string {
  return `admin@${slug}.com`;
}

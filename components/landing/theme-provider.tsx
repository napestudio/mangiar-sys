import { buildThemeStyles } from "@/lib/theme-utils";
import type { RestaurantTheme } from "@/types/restaurant-theme";

/**
 * Server component that injects per-restaurant CSS custom properties
 * as an inline <style> tag in the landing page.
 *
 * Variables defined here (--rt-*) are only present in the landing page
 * layout and never bleed into the dashboard.
 */
export default function LandingThemeProvider({
  theme,
}: {
  theme: RestaurantTheme;
}) {
  const cssVars = buildThemeStyles(theme);
  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: CSS variables are built server-side from validated hex/enum values — no user-controlled HTML
      dangerouslySetInnerHTML={{
        __html: `:root { ${cssVars} }`,
      }}
    />
  );
}

import type {
  ButtonShape,
  ButtonVariant,
  FontFamily,
  RestaurantTheme,
} from "@/types/restaurant-theme";
import { DEFAULT_THEME } from "@/types/restaurant-theme";

const VALID_BUTTON_SHAPES: ButtonShape[] = ["pill", "rounded", "sharp"];
const VALID_BUTTON_VARIANTS: ButtonVariant[] = ["solid", "outline"];
const VALID_FONT_FAMILIES: FontFamily[] = ["geist", "poppins", "serif"];
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

/**
 * Safely parses raw JSON from the database into a RestaurantTheme,
 * falling back to DEFAULT_THEME values for any missing or invalid keys.
 */
export function parseTheme(raw: unknown): RestaurantTheme {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_THEME };
  }

  const obj = raw as Record<string, unknown>;

  return {
    primaryColor: isHexColor(obj.primaryColor)
      ? obj.primaryColor
      : DEFAULT_THEME.primaryColor,
    backgroundColor: isHexColor(obj.backgroundColor)
      ? obj.backgroundColor
      : DEFAULT_THEME.backgroundColor,
    textColor: isHexColor(obj.textColor)
      ? obj.textColor
      : DEFAULT_THEME.textColor,
    buttonShape: VALID_BUTTON_SHAPES.includes(obj.buttonShape as ButtonShape)
      ? (obj.buttonShape as ButtonShape)
      : DEFAULT_THEME.buttonShape,
    buttonVariant: VALID_BUTTON_VARIANTS.includes(
      obj.buttonVariant as ButtonVariant,
    )
      ? (obj.buttonVariant as ButtonVariant)
      : DEFAULT_THEME.buttonVariant,
    fontFamily: VALID_FONT_FAMILIES.includes(obj.fontFamily as FontFamily)
      ? (obj.fontFamily as FontFamily)
      : DEFAULT_THEME.fontFamily,
  };
}

const BUTTON_SHAPE_RADIUS: Record<ButtonShape, string> = {
  pill: "9999px",
  rounded: "8px",
  sharp: "0px",
};

const FONT_FAMILY_VALUE: Record<FontFamily, string> = {
  geist: "var(--font-geist-sans), sans-serif",
  poppins: "var(--font-poppins), sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

/**
 * Builds the CSS custom properties string to inject into the landing page.
 * Scoped to :root so it only applies when this style block is present
 * (the landing page layout, not the dashboard).
 */
export function buildThemeStyles(theme: RestaurantTheme): string {
  return `
    --rt-primary: ${theme.primaryColor};
    --rt-bg: ${theme.backgroundColor};
    --rt-text: ${theme.textColor};
    --rt-btn-radius: ${BUTTON_SHAPE_RADIUS[theme.buttonShape]};
    --rt-font: ${FONT_FAMILY_VALUE[theme.fontFamily]};
  `.trim();
}

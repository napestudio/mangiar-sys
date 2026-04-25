import type {
  ButtonShape,
  ButtonVariant,
  FontFamily,
  RestaurantTheme,
} from "@/types/restaurant-theme";
import { DEFAULT_THEME } from "@/types/restaurant-theme";

const VALID_BUTTON_SHAPES: ButtonShape[] = ["pill", "rounded", "sharp"];
const VALID_BUTTON_VARIANTS: ButtonVariant[] = ["solid", "outline"];
const VALID_FONT_FAMILIES: FontFamily[] = ["geist", "poppins", "serif", "nunito", "playfair"];
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
    cardColor: isHexColor(obj.cardColor)
      ? obj.cardColor
      : DEFAULT_THEME.cardColor,
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

/**
 * Returns the relative luminance (0–1) of a hex color.
 * Uses the WCAG formula for determining readable contrast.
 */
function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const linearize = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Returns a dark or light text color that contrasts well with the given background. */
function contrastText(bgHex: string): string {
  return hexLuminance(bgHex) > 0.179 ? "#171717" : "#f5f5f5";
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
  nunito: "var(--font-nunito), sans-serif",
  playfair: "var(--font-playfair), serif",
};

/**
 * Builds the CSS custom properties string to inject into the landing page.
 * Scoped to :root so it only applies when this style block is present
 * (the landing page layout, not the dashboard).
 */
export function buildThemeStyles(theme: RestaurantTheme): string {
  const cardText = contrastText(theme.cardColor);
  return `
    --rt-primary: ${theme.primaryColor};
    --rt-bg: ${theme.backgroundColor};
    --rt-text: ${theme.textColor};
    --rt-text-muted: color-mix(in srgb, ${theme.textColor} 55%, transparent);
    --rt-card-bg: ${theme.cardColor};
    --rt-card-text: ${cardText};
    --rt-card-text-muted: color-mix(in srgb, ${cardText} 55%, transparent);
    --rt-btn-radius: ${BUTTON_SHAPE_RADIUS[theme.buttonShape]};
    --rt-font: ${FONT_FAMILY_VALUE[theme.fontFamily]};
  `.trim();
}

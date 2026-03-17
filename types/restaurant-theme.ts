export type ButtonShape = "pill" | "rounded" | "sharp";
export type ButtonVariant = "solid" | "outline";
export type FontFamily = "geist" | "poppins" | "serif";

export interface RestaurantTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonShape: ButtonShape;
  buttonVariant: ButtonVariant;
  fontFamily: FontFamily;
}

export const DEFAULT_THEME: RestaurantTheme = {
  primaryColor: "#bc0012",
  backgroundColor: "#ffffff",
  textColor: "#171717",
  buttonShape: "pill",
  buttonVariant: "outline",
  fontFamily: "geist",
};

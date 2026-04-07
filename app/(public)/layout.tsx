import { getPublicRestaurantAndBranch } from "@/lib/public-branch";
import LandingThemeProvider from "@/components/landing/theme-provider";
import { DEFAULT_THEME } from "@/types/restaurant-theme";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getPublicRestaurantAndBranch();
  const theme = data?.theme ?? DEFAULT_THEME;

  return (
    <>
      <LandingThemeProvider theme={theme} />
      {children}
    </>
  );
}

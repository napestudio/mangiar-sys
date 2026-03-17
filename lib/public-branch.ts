import { parseTheme } from "@/lib/theme-utils";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Resolves the branch ID for public (unauthenticated) pages
 * by reading the x-subdomain header set by middleware and
 * looking up the corresponding restaurant + first branch.
 */
export async function getPublicBranchId(): Promise<string | null> {
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") ?? "";
  if (!subdomain) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: subdomain },
    include: { branches: { take: 1 } },
  });

  return restaurant?.branches[0]?.id ?? null;
}

/**
 * Returns restaurant data + branchId in a single query for public landing pages.
 * Returns null when no subdomain header is set or no matching restaurant exists.
 */
export async function getPublicRestaurantAndBranch() {
  const subdomain = (await headers()).get("x-subdomain") ?? "";
  if (!subdomain) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: subdomain },
    select: {
      id: true,
      name: true,
      description: true,
      phone: true,
      logoUrl: true,
      address: true,
      city: true,
      state: true,
      whatsappNumber: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
      tiktokUrl: true,
      theme: true,
      branches: { take: 1, select: { id: true } },
    },
  });

  if (!restaurant?.branches[0]) return null;

  const { branches, theme, ...rest } = restaurant;
  return {
    restaurant: rest,
    branchId: branches[0].id,
    theme: parseTheme(theme),
  };
}

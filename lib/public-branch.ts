import { parseTheme } from "@/lib/theme-utils";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SerializedHomePageLink } from "@/types/home-page";

export type LandingBusinessHour = {
  id: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  label: string | null;
  order: number;
};

const fetchLandingData = (slug: string) =>
  unstable_cache(
    async () => {
      const data = await prisma.restaurant.findUnique({
        where: { slug },
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
          branches: {
            take: 1,
            select: {
              id: true,
              homePageLinks: {
                where: { isActive: true },
                select: {
                  id: true,
                  branchId: true,
                  type: true,
                  label: true,
                  order: true,
                  isActive: true,
                  menuId: true,
                  timeSlotId: true,
                  customUrl: true,
                  createdAt: true,
                  updatedAt: true,
                  menu: { select: { id: true, name: true, slug: true } },
                  timeSlot: { select: { id: true, name: true } },
                },
                orderBy: { order: "asc" },
              },
            },
          },
          businessHours: {
            orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
            select: {
              id: true,
              dayOfWeek: true,
              openTime: true,
              closeTime: true,
              label: true,
              order: true,
            },
          },
        },
      });

      if (!data?.branches[0]) return null;

      // Serialize Date objects before storing in cache — unstable_cache uses
      // JSON serialization, so Dates would lose their prototype on retrieval.
      const branch = data.branches[0];
      const links: SerializedHomePageLink[] = branch.homePageLinks.map(
        (link) => ({
          id: link.id,
          branchId: link.branchId,
          type: link.type,
          label: link.label,
          order: link.order,
          isActive: link.isActive,
          menuId: link.menuId,
          timeSlotId: link.timeSlotId,
          customUrl: link.customUrl,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
          menu: link.menu,
          timeSlot: link.timeSlot,
        }),
      );

      return {
        restaurant: {
          id: data.id,
          name: data.name,
          description: data.description,
          phone: data.phone,
          logoUrl: data.logoUrl,
          address: data.address,
          city: data.city,
          state: data.state,
          whatsappNumber: data.whatsappNumber,
          websiteUrl: data.websiteUrl,
          facebookUrl: data.facebookUrl,
          instagramUrl: data.instagramUrl,
          twitterUrl: data.twitterUrl,
          linkedinUrl: data.linkedinUrl,
          tiktokUrl: data.tiktokUrl,
          theme: data.theme,
        },
        branchId: branch.id,
        links,
        hours: data.businessHours as LandingBusinessHour[],
      };
    },
    [`restaurant-landing-${slug}`],
    { tags: [`restaurant-landing-${slug}`] },
  )();

/**
 * Returns restaurant data, branchId, theme, active homepage links, and
 * business hours in a single DB query for public landing pages.
 * Uses React.cache for request-level deduplication (shared between
 * generateMetadata and the page component) and unstable_cache for
 * cross-request caching with tag-based invalidation.
 *
 * Returns null when no subdomain header is set or no matching restaurant exists.
 */
export const getPublicRestaurantAndBranch = cache(async () => {
  const subdomain = (await headers()).get("x-subdomain") ?? "";
  if (!subdomain) return null;

  const data = await fetchLandingData(subdomain);
  if (!data) return null;

  return {
    ...data,
    theme: parseTheme(data.restaurant.theme),
    restaurant: data.restaurant,
  };
});

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
 * Looks up a restaurant's slug from a branchId.
 * Used by mutation actions to call revalidateTag after data changes.
 */
export async function getRestaurantSlugByBranchId(
  branchId: string,
): Promise<string | null> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { restaurant: { select: { slug: true } } },
  });
  return branch?.restaurant.slug ?? null;
}

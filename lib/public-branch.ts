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

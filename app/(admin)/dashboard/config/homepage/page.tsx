import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import {
  getHomePageLinks,
  getAvailableMenus,
  getAvailableTimeSlots,
} from "@/actions/HomePageLinks";
import { getRestaurantTheme } from "@/actions/Restaurant";
import HomePageConfigClient from "./homepage-config-client";
import prisma from "@/lib/prisma";

export default async function HomePageConfigPage() {
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_CONFIG);

  // Fetch all necessary data
  const [linksResult, menusResult, timeSlotsResult, branch] =
    await Promise.all([
      getHomePageLinks(branchId),
      getAvailableMenus(branchId),
      getAvailableTimeSlots(branchId),
      prisma.branch.findUnique({
        where: { id: branchId },
        select: { restaurantId: true, restaurant: { select: { slug: true } } },
      }),
    ]);

  const links = linksResult.success && linksResult.data ? linksResult.data : [];
  const menus = menusResult.success && menusResult.data ? menusResult.data : [];
  const timeSlots =
    timeSlotsResult.success && timeSlotsResult.data ? timeSlotsResult.data : [];
  const restaurantSlug = branch?.restaurant.slug ?? null;
  const restaurantId = branch?.restaurantId ?? "";

  const theme = restaurantId ? await getRestaurantTheme(restaurantId) : null;

  return (
    <div className="bg-gray-50 w-full min-h-svh">
      <div className="px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <HomePageConfigClient
          branchId={branchId}
          initialLinks={links}
          availableMenus={menus}
          availableTimeSlots={timeSlots}
          restaurantSlug={restaurantSlug}
          restaurantId={restaurantId}
          initialTheme={theme}
        />
      </div>
    </div>
  );
}

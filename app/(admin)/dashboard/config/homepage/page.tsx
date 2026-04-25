import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import {
  getHomePageLinks,
  getAvailableMenus,
  getAvailableTimeSlots,
} from "@/actions/HomePageLinks";
import { getRestaurantTheme } from "@/actions/Restaurant";
import HomePageConfigClient from "./homepage-config-client";
import { getBranchCached } from "@/actions/Branch";

export default async function HomePageConfigPage() {
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_CONFIG);

  // getBranchCached is warm from the layout — ~0ms on cache hit
  const branchResult = await getBranchCached(branchId);
  const restaurantId = branchResult.data?.restaurantId ?? "";
  const restaurantSlug = branchResult.data?.restaurant?.slug ?? null;

  // All four fetches run in parallel now that we have restaurantId
  const [linksResult, menusResult, timeSlotsResult, theme] =
    await Promise.all([
      getHomePageLinks(branchId),
      getAvailableMenus(branchId),
      getAvailableTimeSlots(branchId),
      restaurantId ? getRestaurantTheme(restaurantId) : Promise.resolve(null),
    ]);

  const links = linksResult.success && linksResult.data ? linksResult.data : [];
  const menus = menusResult.success && menusResult.data ? menusResult.data : [];
  const timeSlots =
    timeSlotsResult.success && timeSlotsResult.data ? timeSlotsResult.data : [];

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

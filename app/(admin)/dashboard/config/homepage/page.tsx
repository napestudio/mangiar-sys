import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import {
  getHomePageLinks,
  getAvailableMenus,
  getAvailableTimeSlots,
} from "@/actions/HomePageLinks";
import HomePageConfigClient from "./homepage-config-client";
import prisma from "@/lib/prisma";

export default async function HomePageConfigPage() {
  const { branchId } = await requireRole(UserRole.ADMIN);

  // Fetch all necessary data
  const [linksResult, menusResult, timeSlotsResult, branch] =
    await Promise.all([
      getHomePageLinks(branchId),
      getAvailableMenus(branchId),
      getAvailableTimeSlots(branchId),
      prisma.branch.findUnique({
        where: { id: branchId },
        select: { restaurant: { select: { slug: true } } },
      }),
    ]);

  const links = linksResult.success && linksResult.data ? linksResult.data : [];
  const menus = menusResult.success && menusResult.data ? menusResult.data : [];
  const timeSlots =
    timeSlotsResult.success && timeSlotsResult.data ? timeSlotsResult.data : [];
  const restaurantSlug = branch?.restaurant.slug ?? null;

  return (
    <div className="bg-gray-50 w-full min-h-svh">
      <div className="px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <HomePageConfigClient
          branchId={branchId}
          initialLinks={links}
          availableMenus={menus}
          availableTimeSlots={timeSlots}
          restaurantSlug={restaurantSlug}
        />
      </div>
    </div>
  );
}

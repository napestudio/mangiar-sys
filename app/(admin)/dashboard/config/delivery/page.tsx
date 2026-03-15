import { getDeliveryConfig, getMenusForBranch } from "@/actions/DeliveryConfig";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import DeliveryConfigClient from "./delivery-config-client";

export default async function DeliveryConfigPage() {
  const { branchId } = await requireRole(UserRole.ADMIN);

  // Fetch delivery config and available menus
  const [configResult, menusResult] = await Promise.all([
    getDeliveryConfig(branchId),
    getMenusForBranch(branchId),
  ]);

  const config =
    configResult.success && configResult.data ? configResult.data : null;
  const menus = menusResult.success && menusResult.data ? menusResult.data : [];

  return (
    <div className="bg-gray-50 w-full min-h-svh">
      <div className="px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <DeliveryConfigClient
          branchId={branchId}
          initialConfig={config}
          availableMenus={menus || []}
        />
      </div>
    </div>
  );
}

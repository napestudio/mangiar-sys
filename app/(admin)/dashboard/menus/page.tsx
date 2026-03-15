import { getMenus } from "@/actions/menus";
import { MenusClient } from "./components/menus-client";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import { getBranch } from "@/actions/Branch";

export default async function MenusPage() {
  const { branchId } = await requireRole(UserRole.ADMIN);

  const branchResult = await getBranch(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  const menus = await getMenus(restaurantId);

  return (
    <div className=" bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Menús</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configuración de Cartas y Menús
          </p>
        </div>

        <MenusClient initialMenus={menus} restaurantId={restaurantId} branchId={branchId} />
      </main>
    </div>
  );
}

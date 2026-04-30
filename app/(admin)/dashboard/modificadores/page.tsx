import { PermissionGrant, UserRole } from "@/app/generated/prisma";
import { getBranchCached } from "@/actions/Branch";
import { requireRole } from "@/lib/permissions/middleware";
import { getModifierGroupsByRestaurant } from "@/actions/ModifierGroups";
import { getIngredientsByRestaurant } from "@/actions/Ingredients";
import ModifiersClient from "./components/modifiers-client";

export default async function ModificadoresPage() {
  const { branchId } = await requireRole(
    UserRole.ADMIN,
    PermissionGrant.MANAGE_PRODUCTS
  );

  const branchResult = await getBranchCached(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  const [groupsResult, ingredientsResult] = await Promise.all([
    getModifierGroupsByRestaurant(restaurantId),
    getIngredientsByRestaurant(restaurantId, branchId),
  ]);

  const groups =
    groupsResult.success && groupsResult.data ? groupsResult.data : [];
  const ingredients =
    ingredientsResult.success && ingredientsResult.data
      ? ingredientsResult.data
      : [];

  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Modificadores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Creá grupos de opciones reutilizables (sabores, proteínas, toppings)
            y asocialos a los productos desde el editor de productos.
          </p>
        </div>
        <ModifiersClient
          initialGroups={groups}
          availableIngredients={ingredients}
          restaurantId={restaurantId}
        />
      </main>
    </div>
  );
}

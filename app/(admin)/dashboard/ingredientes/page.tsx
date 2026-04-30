import { PermissionGrant, UserRole } from "@/app/generated/prisma";
import { getBranchCached } from "@/actions/Branch";
import { requireRole } from "@/lib/permissions/middleware";
import { getIngredientsByRestaurant } from "@/actions/Ingredients";
import IngredientsClient from "./components/ingredients-client";

export default async function IngredientsPage() {
  const { branchId } = await requireRole(
    UserRole.ADMIN,
    PermissionGrant.MANAGE_PRODUCTS
  );

  const branchResult = await getBranchCached(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  const ingredientsResult = await getIngredientsByRestaurant(
    restaurantId,
    branchId
  );
  const ingredients =
    ingredientsResult.success && ingredientsResult.data
      ? ingredientsResult.data
      : [];

  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ingredientes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestioná los ingredientes y materias primas para calcular costos de
            recetas y controlar el stock.
          </p>
        </div>
        <IngredientsClient
          initialIngredients={ingredients}
          restaurantId={restaurantId}
          branchId={branchId}
        />
      </main>
    </div>
  );
}

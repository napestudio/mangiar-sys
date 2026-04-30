import { getMenuItemsPaginated, getCategories } from "@/actions/Products";
import { ProductsClient } from "./components/product-client";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import { getBranchCached } from "@/actions/Branch";
import { getStationsByBranch } from "@/actions/Station";
import { getIngredientsByRestaurant } from "@/actions/Ingredients";
import { getModifierGroupsByRestaurant } from "@/actions/ModifierGroups";

type SearchParams = {
  page?: string;
  search?: string;
  category?: string;
  stockStatus?: string;
  unitType?: string;
  includeInactive?: string;
};

export default async function MenuItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_PRODUCTS);

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  const branchResult = await getBranchCached(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  // Parse filters from URL
  const page = parseInt(params.page || "1");
  const search = params.search;
  const categoryId = params.category || "all";
  const stockStatus = params.stockStatus || "all";
  const unitType = params.unitType || "all";
  const includeInactive = params.includeInactive === "true";

  // Fetch paginated menu items, categories, stations, ingredients, and modifier groups
  const [productsResult, categoriesResult, stationsResult, ingredientsResult, modifierGroupsResult] = await Promise.all([
    getMenuItemsPaginated({
      restaurantId,
      branchId,
      page,
      pageSize: 20,
      search,
      categoryId,
      stockStatus,
      unitType,
      includeInactive,
    }),
    getCategories(restaurantId),
    getStationsByBranch(branchId),
    getIngredientsByRestaurant(restaurantId, branchId),
    getModifierGroupsByRestaurant(restaurantId),
  ]);

  const menuItems =
    productsResult.success && productsResult.data?.products
      ? productsResult.data.products
      : [];
  const pagination =
    productsResult.success && productsResult.data?.pagination
      ? productsResult.data.pagination
      : { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 };
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];

  const stations =
    stationsResult.success && stationsResult.data
      ? stationsResult.data.map((s) => ({ id: s.id, name: s.name, color: s.color }))
      : [];

  const availableIngredients =
    ingredientsResult.success && ingredientsResult.data
      ? ingredientsResult.data
      : [];

  const availableModifierGroups =
    modifierGroupsResult.success && modifierGroupsResult.data
      ? modifierGroupsResult.data
      : [];

  // Data is already serialized by the server action
  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Productos, precios y stock
          </p>
        </div>

        <ProductsClient
          initialMenuItems={menuItems}
          initialPagination={pagination}
          initialFilters={{
            search,
            category: categoryId,
            stockStatus,
            unitType,
            includeInactive,
          }}
          categories={categories}
          restaurantId={restaurantId}
          branchId={branchId}
          stations={stations}
          availableIngredients={availableIngredients}
          availableModifierGroups={availableModifierGroups}
        />
      </main>
    </div>
  );
}

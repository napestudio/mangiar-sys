import { getBranchStockSummary, getLowStockAlerts, getCombosForBranch } from "@/actions/stock";
import { StockManagementClient } from "./components/stock-management-client";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";

export default async function StockPage() {
  const { branchId } = await requireRole(UserRole.MANAGER, PermissionGrant.VIEW_STOCK);

  // Fetch stock summary, low stock alerts, and combos
  const [summaryResult, alertsResult, combosResult] = await Promise.all([
    getBranchStockSummary(branchId),
    getLowStockAlerts(branchId),
    getCombosForBranch(branchId),
  ]);

  const summary =
    summaryResult.success && summaryResult.data ? summaryResult.data : null;
  const alerts =
    alertsResult.success && alertsResult.data ? alertsResult.data : [];
  const combos =
    combosResult.success && combosResult.data ? combosResult.data : [];

  // Data is already serialized by the server actions
  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Stock</h1>
          <p className="mt-2 text-sm text-gray-600">
            Inventario y ajustes de stock
          </p>
        </div>

        <StockManagementClient
          branchId={branchId}
          initialSummary={summary}
          initialAlerts={alerts}
          initialCombos={combos}
        />
      </main>
    </div>
  );
}

import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import { getFiscalConfig } from "@/actions/FiscalConfig";
import { FiscalConfigClient } from "./fiscal-config-client";
import { getBranchCached } from "@/actions/Branch";

export default async function FiscalConfigPage() {
  // Only admins can access fiscal config
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_CONFIG);

  const branchResult = await getBranchCached(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  // Fetch current fiscal configuration
  const result = await getFiscalConfig(restaurantId);

  return (
    <div className="min-h-svh bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración Fiscal
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configura los datos fiscales y credenciales ARCA para facturación
            electrónica
          </p>
        </div>

        <FiscalConfigClient
          initialConfig={result.success ? result.data : null}
          restaurantId={restaurantId}
        />
      </div>
    </div>
  );
}

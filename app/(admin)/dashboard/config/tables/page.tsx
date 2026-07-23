import { getTablesWithStatus } from "@/actions/Table";
import { TablesClientWrapper } from "@/components/dashboard/tables-client-wrapper";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import { getSectorsByBranch } from "@/actions/Sector";

export default async function ConfigTables() {
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_CONFIG);
  const [tablesResult, sectorsResult] = await Promise.all([
    getTablesWithStatus(branchId),
    getSectorsByBranch(branchId),
  ]);
  const tables =
    tablesResult.success && tablesResult.data ? tablesResult.data : [];

  return (
    <div className="pt-3">
      <TablesClientWrapper
        branchId={branchId}
        initialTables={tables}
        editModeOnly={true}
        initialSectors={sectorsResult.data}
      />
    </div>
  );
}

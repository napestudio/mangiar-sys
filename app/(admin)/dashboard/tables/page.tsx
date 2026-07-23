import { getTablesWithStatus } from "@/actions/Table";
import { getSectorsByBranch } from "@/actions/Sector";
import { TablesClientWrapper } from "@/components/dashboard/tables-client-wrapper";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tableId?: string;
    partySize?: string;
    customerEmail?: string;
  }>;
}) {
  const { branchId } = await requireRole(UserRole.WAITER);

  const { tableId, partySize, customerEmail } = await searchParams;

  // Fetch tables and sectors in parallel
  const [tablesResult, sectorsResult] = await Promise.all([
    getTablesWithStatus(branchId),
    getSectorsByBranch(branchId),
  ]);

  if (!tablesResult.success || !tablesResult.data) {
    return <div>Error loading tables</div>;
  }

  if (!sectorsResult.success || !sectorsResult.data) {
    return <div>Error loading sectors</div>;
  }

  return (
    <div className="min-h-svh pt-19">
      <TablesClientWrapper
        branchId={branchId}
        initialTables={tablesResult.data}
        initialSectors={sectorsResult.data}
        initialTableId={tableId}
        initialPartySize={partySize ? Number(partySize) : undefined}
        initialCustomerEmail={customerEmail}
      />
    </div>
  );
}

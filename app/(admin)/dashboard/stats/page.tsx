import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import { getAllStats } from "@/actions/Statistics";

import { subDays } from "date-fns";
import { StatsClient } from "@/components/dashboard/stats/stats-client";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { branchId } = await requireRole(UserRole.MANAGER);
  const to = new Date();
  const from = subDays(to, 30);

  const stats = await getAllStats(branchId, from, to);

  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <StatsClient
          branchId={branchId}
          initialStats={stats}
          initialFrom={from.toISOString()}
          initialTo={to.toISOString()}
        />
      </main>
    </div>
  );
}

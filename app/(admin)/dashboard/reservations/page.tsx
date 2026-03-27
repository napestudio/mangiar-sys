import { getFilteredReservations } from "@/actions/Reservation";
import { getBranch } from "@/actions/Branch";
import { ReservationsManager } from "@/components/dashboard/reservations-manager";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";

export default async function ReservationsPage() {
  const { branchId } = await requireRole(UserRole.WAITER);

  // Time slots are NOT fetched here — they load lazily when the Create Reservation dialog opens
  const [reservationsResult, branchResult] = await Promise.all([
    getFilteredReservations(branchId, { type: "today", limit: 10 }),
    getBranch(branchId),
  ]);

  const reservations =
    reservationsResult.success && reservationsResult.data
      ? reservationsResult.data.reservations
      : [];

  const pagination =
    reservationsResult.success && reservationsResult.data
      ? {
          nextCursor: reservationsResult.data.nextCursor,
          hasMore: reservationsResult.data.hasMore,
          totalCount: reservationsResult.data.totalCount,
        }
      : { nextCursor: null, hasMore: false, totalCount: 0 };
  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <ReservationsManager
          initialReservations={reservations}
          initialPagination={pagination}
          branchId={branchId}
          notificationEmail={branchResult.success ? branchResult.data?.notificationEmail ?? null : null}
        />
      </main>
    </div>
  );
}

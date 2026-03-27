import { TimeSlotsManager } from "@/components/dashboard/time-slots-manager";
import ReservationsConfigSidebar from "@/components/dashboard/reservations-config-sidebar";
import { getTimeSlots } from "@/actions/TimeSlot";
import { getBranch } from "@/actions/Branch";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";

export default async function TimeSlotsPage() {
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_CONFIG);

  // Fetch time slots and branch data in parallel
  const [result, branchResult] = await Promise.all([
    getTimeSlots(branchId),
    getBranch(branchId),
  ]);

  const timeSlots = result.success && result.data ? result.data : [];
  if (!timeSlots) return;

  const notificationEmail =
    branchResult.success && branchResult.data
      ? branchResult.data.notificationEmail
      : null;

  return (
    <div className="bg-gray-50 w-full">
      <div className="px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <ReservationsConfigSidebar
            branchId={branchId}
            initialEmail={notificationEmail}
          />
        </div>
        <TimeSlotsManager initialTimeSlots={timeSlots} branchId={branchId} />
      </div>
    </div>
  );
}

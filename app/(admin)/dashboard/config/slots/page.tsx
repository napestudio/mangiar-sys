import { TimeSlotsManager } from "@/components/dashboard/time-slots-manager";
import BranchNotificationEmailForm from "@/components/dashboard/branch-notification-email-form";
import { getTimeSlots } from "@/actions/TimeSlot";
import { getBranch } from "@/actions/Branch";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";

export default async function TimeSlotsPage() {
  const { branchId } = await requireRole(UserRole.ADMIN);

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
      <div className="px-4 sm:px-6 lg:px-8 pt-20 w-full ">
        <BranchNotificationEmailForm
          branchId={branchId}
          initialEmail={notificationEmail}
        />
        <TimeSlotsManager initialTimeSlots={timeSlots} branchId={branchId} />
      </div>
    </div>
  );
}

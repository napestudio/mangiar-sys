import { requireRole } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
  await requireRole(UserRole.WAITER);

  return (
    <>
      <LogoutButton />
      <DashboardHome />
    </>
  );
}

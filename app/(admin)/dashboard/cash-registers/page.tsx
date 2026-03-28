import { getCashRegistersByBranch } from "@/actions/CashRegister";
import { CashRegistersClient } from "./cash-registers-client";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";

export default async function CashRegistersPage() {
  const { userId, userRole, branchId } = await requireRole(UserRole.MANAGER, PermissionGrant.VIEW_CASH_REGISTERS);

  // Fetch cash registers with their current session status
  const cashRegistersResult = await getCashRegistersByBranch(branchId);
  const cashRegisters =
    cashRegistersResult.success && cashRegistersResult.data
      ? cashRegistersResult.data
      : [];

  // Fetch recent sessions (last 30 days) for the history table
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await prisma.cashRegisterSession.findMany({
    where: {
      cashRegister: {
        branchId,
      },
      openedAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      cashRegister: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          movements: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
    take: 50,
  });

  // Resolve user names for openedBy fields
  const userIds = [...new Set(sessions.map((s) => s.openedBy))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name ?? u.id]));

  // Get current user's name for new sessions opened in the UI
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const currentUserName = currentUser?.name ?? userId;

  // Serialize Decimal fields for client
  const serializedSessions = sessions.map((session) => ({
    ...session,
    openedByName: userMap.get(session.openedBy) ?? session.openedBy,
    openingAmount: Number(session.openingAmount),
    expectedCash: session.expectedCash ? Number(session.expectedCash) : null,
    countedCash: session.countedCash ? Number(session.countedCash) : null,
    variance: session.variance ? Number(session.variance) : null,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    reopenedAt: session.reopenedAt ? session.reopenedAt.toISOString() : null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  }));

  // Serialize registers - need to handle nested sessions with Decimal fields
  const registersWithStatus = cashRegisters.map((register) => ({
    ...register,
    hasOpenSession: register.sessions.length > 0,
    // Serialize sessions inside each register (contains Decimal fields)
    sessions: register.sessions.map((session) => ({
      ...session,
      openingAmount: Number(session.openingAmount),
      expectedCash: session.expectedCash ? Number(session.expectedCash) : null,
      countedCash: session.countedCash ? Number(session.countedCash) : null,
      variance: session.variance ? Number(session.variance) : null,
      openedAt: session.openedAt.toISOString(),
      closedAt: session.closedAt ? session.closedAt.toISOString() : null,
      reopenedAt: session.reopenedAt ? session.reopenedAt.toISOString() : null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <CashRegistersClient
          branchId={branchId}
          cashRegisters={registersWithStatus}
          initialSessions={serializedSessions}
          userRole={userRole}
          currentUserName={currentUserName}
        />
      </main>
    </div>
  );
}

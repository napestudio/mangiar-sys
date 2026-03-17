"use server";

import { auth } from "@/lib/auth";
import { getUserBranchesByRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * Get the current user's primary branch ID.
 * Returns null if the user is not logged in or has no branches assigned.
 */
export async function getCurrentUserBranchId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userBranches = await getUserBranchesByRole(session.user.id);

  if (userBranches.length === 0) return null;

  // Return first branch (primary)
  // TODO: In future, support branch switching
  return userBranches[0];
}

export type UserBranchWithRestaurant = {
  branchId: string;
  branchName: string;
  role: string;
  restaurant: { id: string; slug: string; name: string };
};

/**
 * Returns all branches the user has access to, with restaurant slug for subdomain routing.
 * Used by /seleccionar after login to determine where to redirect.
 */
export async function getUserBranchesWithRestaurant(
  userId: string
): Promise<UserBranchWithRestaurant[]> {
  const rows = await prisma.userOnBranch.findMany({
    where: { userId },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          restaurant: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    branchId: r.branch.id,
    branchName: r.branch.name,
    role: r.role,
    restaurant: r.branch.restaurant,
  }));
}

"use server";

import { auth } from "@/lib/auth";
import { getUserBranchesByRole } from "@/lib/permissions";

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

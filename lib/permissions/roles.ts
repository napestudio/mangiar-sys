import "server-only";
import { UserRole } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Server-only role functions (require database access)
 * For client-safe utilities, import from "./role-utils" instead
 */

/**
 * Get user's role in their primary branch
 * Simple, no caching needed for now
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const userOnBranch = await prisma.userOnBranch.findFirst({
    where: { userId },
    select: { role: true },
  });

  return userOnBranch?.role ?? null;
}

/**
 * Get user's role and branchId from their primary branch in one query.
 * Cached for 5 minutes — invalidate with revalidateTag("user-role-and-branch")
 * when UserOnBranch.role changes.
 */
export const getUserRoleAndBranchId = unstable_cache(
  async (userId: string): Promise<{ role: UserRole; branchId: string } | null> => {
    const userOnBranch = await prisma.userOnBranch.findFirst({
      where: { userId },
      select: { role: true, branchId: true },
    });
    return userOnBranch ?? null;
  },
  ["user-role-and-branch"],
  { revalidate: 300, tags: ["user-role-and-branch"] }
);

// Re-export client-safe utilities for convenience
export {
  hasMinimumRole,
  isAdminOrHigher,
  isManagerOrHigher,
} from "./role-utils";

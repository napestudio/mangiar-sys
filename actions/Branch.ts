"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export async function getBranch(branchId: string) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: { select: { name: true, slug: true } } },
    });

    return { success: true, data: branch };
  } catch (error) {
    console.error("Error fetching branch:", error);
    return { success: false, error: "Error al obtener la sucursal" };
  }
}

/**
 * Cached version of getBranch for the dashboard layout.
 * Branch name and printerServerUrl rarely change.
 * Invalidate with revalidateTag("branch-data") when branch is updated.
 */
export const getBranchCached = unstable_cache(
  async (branchId: string) => {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: { select: { name: true, slug: true } } },
    });
    return { success: true as const, data: branch };
  },
  ["branch-data"],
  { revalidate: 300, tags: ["branch-data"] }
);

export async function updateBranch(
  branchId: string,
  data: { notificationEmail?: string; printerServerUrl?: string | null }
) {
  try {
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(data.notificationEmail !== undefined && {
          notificationEmail: data.notificationEmail || null,
        }),
        ...(data.printerServerUrl !== undefined && {
          printerServerUrl: data.printerServerUrl || null,
        }),
      },
    });

    revalidatePath("/dashboard/config/slots");
    revalidatePath("/dashboard/config/printers");
    revalidateTag("branch-data");

    return { success: true, data: branch };
  } catch (error) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Error al actualizar la sucursal" };
  }
}

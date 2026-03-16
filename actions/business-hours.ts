"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isUserAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { saveBusinessHoursSchema } from "@/lib/validations/business-hours";
import type { ActionResult } from "@/types/action-result";

export type BusinessHoursPeriodData = {
  id: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  label: string | null;
  order: number;
};

export async function getBusinessHours(
  restaurantId: string,
): Promise<ActionResult<BusinessHoursPeriodData[]>> {
  try {
    const periods = await prisma.businessHours.findMany({
      where: { restaurantId },
      orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
      select: {
        id: true,
        dayOfWeek: true,
        openTime: true,
        closeTime: true,
        label: true,
        order: true,
      },
    });
    return { success: true, data: periods };
  } catch {
    return { success: false, error: "Error al obtener los horarios de atención" };
  }
}

export async function saveBusinessHours(
  restaurantId: string,
  periodsInput: unknown,
): Promise<ActionResult<BusinessHoursPeriodData[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Debes iniciar sesión para realizar esta acción" };
    }

    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return { success: false, error: "No tenés permisos para modificar los horarios" };
    }

    const validation = saveBusinessHoursSchema.safeParse({
      restaurantId,
      periods: periodsInput,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message ?? "Error de validación" };
    }

    const { periods } = validation.data;

    const saved = await prisma.$transaction(async (tx) => {
      await tx.businessHours.deleteMany({ where: { restaurantId } });

      if (periods.length === 0) return [];

      await tx.businessHours.createMany({
        data: periods.map((p) => ({
          restaurantId,
          dayOfWeek: p.dayOfWeek,
          openTime: p.openTime,
          closeTime: p.closeTime,
          label: p.label ?? null,
          order: p.order,
        })),
      });

      return tx.businessHours.findMany({
        where: { restaurantId },
        orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
        select: {
          id: true,
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          label: true,
          order: true,
        },
      });
    });

    revalidatePath("/dashboard/config/restaurant");

    return { success: true, data: saved };
  } catch (error) {
    console.error("saveBusinessHours error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: `Error al guardar los horarios: ${message}` };
  }
}

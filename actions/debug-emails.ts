"use server";

import { authorizeAction } from "@/lib/permissions/middleware";
import { UserRole } from "@/app/generated/prisma";
import { sendReservationNotificationEmail } from "@/lib/send-reservation-email";
import { ActionResult } from "@/types/action-result";

interface TestEmailResult {
  restaurant?: { success: boolean; messageId?: string; error?: string };
  customer?: { success: boolean; messageId?: string; error?: string };
}

export async function sendTestReservationEmails(params: {
  restaurantEmail: string;
  customerEmail: string;
}): Promise<ActionResult<TestEmailResult>> {
  await authorizeAction(UserRole.SUPERADMIN);

  const result = await sendReservationNotificationEmail({
    customerName: "Juan Pérez (Test)",
    customerEmail: params.customerEmail,
    customerPhone: "+54 9 11 1234-5678",
    date: new Date(),
    time: "20:00",
    guests: 4,
    branchName: "Restaurante Demo",
    notificationEmail: params.restaurantEmail,
    timeSlotName: "Cena",
    dietaryRestrictions: "Sin gluten",
    notes: "Este es un email de prueba generado desde el panel de debug.",
    status: "CONFIRMED",
    autoAssigned: true,
    assignedTables: ["Mesa 5"],
    pricePerPerson: 3500,
  });

  return { success: true, data: result };
}

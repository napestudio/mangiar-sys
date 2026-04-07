"use server";

import { getResendClient } from "./resend";
import { generateReservationNotificationEmail } from "./email-templates/reservation-notification";
import { generateReservationConfirmationEmail } from "./email-templates/reservation-confirmation";
import { formatDateAR } from "./date-utils";

interface SendReservationEmailParams {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: Date;
  time: string;
  guests: number;
  branchName: string;
  notificationEmail?: string | null;
  timeSlotName?: string;
  exactTime?: Date;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  notes?: string;
  status: string;
  autoAssigned: boolean;
  assignedTables?: string[];
  pricePerPerson?: number;
}

export async function sendReservationNotificationEmail(
  params: SendReservationEmailParams
) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn("Email configuration missing. Skipping email notifications.");
    return { success: false, error: "Email configuration not set up" };
  }

  const formattedDate = formatDateAR(params.date.toISOString());
  const from = `${params.branchName} vía Mangiar <${process.env.EMAIL_FROM}>`;

  const results: {
    restaurant?: { success: boolean; messageId?: string; error?: string };
    customer?: { success: boolean; messageId?: string; error?: string };
  } = {};

  const resend = getResendClient();

  // --- Restaurant notification ---
  const MONITOR_EMAIL = process.env.RESEND_INTERNAL_MONITOR;
  const restaurantRecipients: string[] = params.notificationEmail
    ? [params.notificationEmail, ...(MONITOR_EMAIL ? [MONITOR_EMAIL] : [])]
    : MONITOR_EMAIL
    ? [MONITOR_EMAIL]
    : [];

  if (restaurantRecipients.length > 0) {
    try {
      const html = generateReservationNotificationEmail({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        date: params.date.toISOString(),
        time: params.time,
        guests: params.guests,
        timeSlotName: params.timeSlotName,
        exactTime: params.exactTime?.toISOString(),
        dietaryRestrictions: params.dietaryRestrictions,
        accessibilityNeeds: params.accessibilityNeeds,
        notes: params.notes,
        status: params.status,
        autoAssigned: params.autoAssigned,
        assignedTables: params.assignedTables,
        pricePerPerson: params.pricePerPerson,
      });

      const { data, error } = await resend.emails.send({
        from,
        to: restaurantRecipients,
        subject: `🍽️ Nueva Reserva - ${params.customerName} (${formattedDate})`,
        html,
      });

      if (error) {
        results.restaurant = { success: false, error: error.message };
      } else {
        results.restaurant = { success: true, messageId: data?.id };
      }
    } catch (error) {
      console.error("Error sending restaurant notification email:", error);
      results.restaurant = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // --- Customer confirmation ---
  try {
    const html = generateReservationConfirmationEmail({
      customerName: params.customerName,
      date: params.date.toISOString(),
      time: params.time,
      guests: params.guests,
      branchName: params.branchName,
      timeSlotName: params.timeSlotName,
      exactTime: params.exactTime?.toISOString(),
      dietaryRestrictions: params.dietaryRestrictions,
      accessibilityNeeds: params.accessibilityNeeds,
      notes: params.notes,
      status: params.status,
      pricePerPerson: params.pricePerPerson,
    });

    const { data, error } = await resend.emails.send({
      from,
      to: [params.customerEmail],
      subject: `✅ Reserva recibida en ${params.branchName} (${formattedDate})`,
      html,
    });

    if (error) {
      results.customer = { success: false, error: error.message };
    } else {
      results.customer = { success: true, messageId: data?.id };
    }
  } catch (error) {
    console.error("Error sending customer confirmation email:", error);
    results.customer = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return results;
}

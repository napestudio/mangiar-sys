import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const businessHoursPeriodSchema = z
  .object({
    dayOfWeek: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    openTime: z
      .string()
      .regex(timeRegex, "Hora de apertura inválida (formato HH:MM)"),
    closeTime: z
      .string()
      .regex(timeRegex, "Hora de cierre inválida (formato HH:MM)"),
    label: z.string().max(40, "El nombre del turno es demasiado largo").optional(),
    order: z.number().int().min(0).default(0),
  })
  .refine((d) => d.openTime < d.closeTime, {
    message: "La hora de cierre debe ser posterior a la de apertura",
    path: ["closeTime"],
  });

export const saveBusinessHoursSchema = z.object({
  restaurantId: z.string().min(1),
  periods: z.array(businessHoursPeriodSchema),
});

export type BusinessHoursPeriod = z.infer<typeof businessHoursPeriodSchema>;
export type SaveBusinessHoursInput = z.infer<typeof saveBusinessHoursSchema>;

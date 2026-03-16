import { z } from "zod";
import { RestaurantType } from "@/app/generated/prisma";

export const step1Schema = z.object({
  businessName: z
    .string()
    .min(2, "El nombre del negocio debe tener al menos 2 caracteres")
    .max(60, "El nombre del negocio debe tener máximo 60 caracteres"),
  phone: z
    .string()
    .min(6, "El teléfono debe tener al menos 6 dígitos")
    .max(20, "El teléfono es demasiado largo")
    .regex(/^\+?[\d\s\-()]+$/, "El teléfono solo puede contener números"),
  contactEmail: z.string().email("Ingresá un email de contacto válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener mayúsculas, minúsculas y al menos un número"
    ),
});

export const step2Schema = z.object({
  personName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  restaurantType: z.nativeEnum(RestaurantType),
  promoCode: z.string().optional(),
});

export const fullRegistroSchema = step1Schema.merge(step2Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type FullRegistroData = z.infer<typeof fullRegistroSchema>;

"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isUserAdmin } from "@/lib/permissions";
import type { RestaurantTheme } from "@/types/restaurant-theme";
import { DEFAULT_THEME } from "@/types/restaurant-theme";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

// URL validation regex
const urlRegex = /^https?:\/\/.+/i;

// Helper to create URL validation with optional empty string
const optionalUrl = (errorMessage: string) =>
  z
    .string()
    .optional()
    .refine((val) => !val || val === "" || urlRegex.test(val), {
      message: errorMessage,
    });

const restaurantUpdateSchema = z.object({
  name: z.string().min(1, "El nombre del restaurante es requerido"),
  description: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),

  // Address fields
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Social media links
  websiteUrl: optionalUrl("URL de sitio web inválida"),
  facebookUrl: optionalUrl("URL de Facebook inválida"),
  instagramUrl: optionalUrl("URL de Instagram inválida"),
  twitterUrl: optionalUrl("URL de Twitter inválida"),
  linkedinUrl: optionalUrl("URL de LinkedIn inválida"),
  tiktokUrl: optionalUrl("URL de TikTok inválida"),
  whatsappNumber: z.string().optional(),
});

export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;

export async function getRestaurant(restaurantId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        logoUrl: true,
        isActive: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        tiktokUrl: true,
        whatsappNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!restaurant) {
      return {
        success: false,
        error: "Restaurante no encontrado",
      };
    }

    return {
      success: true,
      data: restaurant,
    };
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return {
      success: false,
      error: "Error al cargar la información del restaurante",
    };
  }
}

export async function updateRestaurant(
  restaurantId: string,
  data: RestaurantUpdateInput,
) {
  try {
    // Check authentication and admin status
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Debes iniciar sesión para realizar esta acción",
      };
    }

    // Check if user has admin role
    const hasAdminAccess = await isUserAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error:
          "No tienes permisos para actualizar la configuración del restaurante",
      };
    }

    // Validate input
    const validation = restaurantUpdateSchema.safeParse(data);

    // console.log("Validation result:", validation);

    if (!validation.success) {
      console.error("Validation error:", validation.error);
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Error de validación",
      };
    }

    const validatedData = validation.data;

    // Update restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        phone: validatedData.phone || null,
        logoUrl: validatedData.logoUrl || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        postalCode: validatedData.postalCode || null,
        country: validatedData.country || null,
        websiteUrl: validatedData.websiteUrl || null,
        facebookUrl: validatedData.facebookUrl || null,
        instagramUrl: validatedData.instagramUrl || null,
        twitterUrl: validatedData.twitterUrl || null,
        linkedinUrl: validatedData.linkedinUrl || null,
        tiktokUrl: validatedData.tiktokUrl || null,
        whatsappNumber: validatedData.whatsappNumber || null,
      },
    });

    revalidatePath("/dashboard/config/restaurant");
    revalidatePath("/");
    revalidateTag(`restaurant-landing-${updatedRestaurant.slug}`);

    return {
      success: true,
      data: updatedRestaurant,
      message: "Configuración del restaurante actualizada exitosamente",
    };
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración del restaurante",
    };
  }
}

const themeUpdateSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color primario inválido"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color de fondo inválido"),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color de texto inválido"),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color de tarjeta inválido"),
  buttonShape: z.enum(["pill", "rounded", "sharp"]),
  buttonVariant: z.enum(["solid", "outline"]),
  fontFamily: z.enum(["geist", "poppins", "serif"]),
});

export async function updateRestaurantTheme(
  restaurantId: string,
  theme: RestaurantTheme,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Debes iniciar sesión para realizar esta acción",
      };
    }

    const hasAdminAccess = await isUserAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "No tienes permisos para actualizar el diseño",
      };
    }

    const validation = themeUpdateSchema.safeParse(theme);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Error de validación",
      };
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { theme: validation.data },
      select: { slug: true },
    });

    revalidatePath("/dashboard/config/appearance");
    revalidatePath("/");
    revalidateTag(`restaurant-landing-${updated.slug}`);

    return { success: true, message: "Diseño actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating restaurant theme:", error);
    return { success: false, error: "Error al actualizar el diseño" };
  }
}

export async function getRestaurantTheme(
  restaurantId: string,
): Promise<RestaurantTheme> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { theme: true },
    });
    if (!restaurant) return { ...DEFAULT_THEME };
    const { parseTheme } = await import("@/lib/theme-utils");
    return parseTheme(restaurant.theme);
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export async function getRestaurantByBranchId(branchId: string) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        restaurant: {
          select: { name: true, logoUrl: true, whatsappNumber: true, phone: true },
        },
      },
    });
    return branch?.restaurant ?? null;
  } catch (error) {
    console.error("Error fetching restaurant by branch:", error);
    return null;
  }
}

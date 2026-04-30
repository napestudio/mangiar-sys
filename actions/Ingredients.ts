"use server";

import { Prisma, UserRole, WeightUnit, VolumeUnit } from "@/app/generated/prisma";
import { authorizeAction } from "@/lib/permissions/middleware";
import { prisma } from "@/lib/prisma";
import { convertLinkQuantityToBase } from "@/lib/unit-conversions";
import { revalidatePath, revalidateTag } from "next/cache";

import type { ActionResult } from "@/types/action-result";
import type {
  CreateIngredientInput,
  IngredientStockInput,
  IngredientWithStats,
  ProductIngredientEntry,
  UpdateIngredientInput,
} from "@/types/ingredients";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeIngredient(
  raw: {
    id: string;
    name: string;
    description: string | null;
    unitType: string;
    weightUnit: string | null;
    volumeUnit: string | null;
    costPerUnit: Prisma.Decimal;
    restaurantId: string;
  },
  stock: number,
  minStock: number | null,
  usedInProducts: number
): IngredientWithStats {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    unitType: raw.unitType as IngredientWithStats["unitType"],
    weightUnit: raw.weightUnit as IngredientWithStats["weightUnit"],
    volumeUnit: raw.volumeUnit as IngredientWithStats["volumeUnit"],
    costPerUnit: Number(raw.costPerUnit),
    restaurantId: raw.restaurantId,
    stock,
    minStock,
    usedInProducts,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createIngredient(
  input: CreateIngredientInput
): Promise<ActionResult<IngredientWithStats>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    const ingredient = await prisma.ingredient.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        unitType: input.unitType,
        weightUnit: input.weightUnit ?? null,
        volumeUnit: input.volumeUnit ?? null,
        costPerUnit: new Prisma.Decimal(input.costPerUnit.toString()),
        restaurantId: input.restaurantId,
      },
    });

    revalidatePath("/dashboard/ingredientes");
    revalidateTag("ingredients");

    return {
      success: true,
      data: serializeIngredient(ingredient, 0, null, 0),
    };
  } catch (error) {
    console.error("Error creating ingredient:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "Ya existe un ingrediente con este nombre",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al crear el ingrediente" };
  }
}

export async function updateIngredient(
  input: UpdateIngredientInput
): Promise<ActionResult<IngredientWithStats>> {
  try {
    const { branchId } = await authorizeAction(UserRole.ADMIN);

    const ingredient = await prisma.ingredient.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.unitType !== undefined && { unitType: input.unitType }),
        ...(input.weightUnit !== undefined && { weightUnit: input.weightUnit }),
        ...(input.volumeUnit !== undefined && { volumeUnit: input.volumeUnit }),
        ...(input.costPerUnit !== undefined && {
          costPerUnit: new Prisma.Decimal(input.costPerUnit.toString()),
        }),
      },
      include: {
        branchStock: { where: { branchId } },
        _count: { select: { productIngredients: true } },
      },
    });

    const stockRow = ingredient.branchStock[0];

    revalidatePath("/dashboard/ingredientes");
    revalidateTag("ingredients");

    return {
      success: true,
      data: serializeIngredient(
        ingredient,
        stockRow ? Number(stockRow.stock) : 0,
        stockRow?.minStock ? Number(stockRow.minStock) : null,
        ingredient._count.productIngredients
      ),
    };
  } catch (error) {
    console.error("Error updating ingredient:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "Ya existe un ingrediente con este nombre",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al actualizar el ingrediente" };
  }
}

export async function deleteIngredient(
  id: string
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.ingredient.delete({ where: { id } });

    revalidatePath("/dashboard/ingredientes");
    revalidateTag("ingredients");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          error:
            "No se puede eliminar un ingrediente que está en uso por productos o modificadores",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al eliminar el ingrediente" };
  }
}

export async function getIngredientsByRestaurant(
  restaurantId: string,
  branchId: string
): Promise<ActionResult<IngredientWithStats[]>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const ingredients = await prisma.ingredient.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      include: {
        branchStock: { where: { branchId } },
        _count: { select: { productIngredients: true } },
      },
    });

    return {
      success: true,
      data: ingredients.map((ing) => {
        const stockRow = ing.branchStock[0];
        return serializeIngredient(
          ing,
          stockRow ? Number(stockRow.stock) : 0,
          stockRow?.minStock ? Number(stockRow.minStock) : null,
          ing._count.productIngredients
        );
      }),
    };
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return { success: false, error: "Error al obtener los ingredientes" };
  }
}

export async function getIngredientById(
  id: string,
  branchId: string
): Promise<ActionResult<IngredientWithStats>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        branchStock: { where: { branchId } },
        _count: { select: { productIngredients: true } },
      },
    });

    if (!ingredient) {
      return { success: false, error: "Ingrediente no encontrado" };
    }

    const stockRow = ingredient.branchStock[0];

    return {
      success: true,
      data: serializeIngredient(
        ingredient,
        stockRow ? Number(stockRow.stock) : 0,
        stockRow?.minStock ? Number(stockRow.minStock) : null,
        ingredient._count.productIngredients
      ),
    };
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    return { success: false, error: "Error al obtener el ingrediente" };
  }
}

// ─── Stock adjustment ─────────────────────────────────────────────────────────

export async function adjustIngredientStock(
  input: IngredientStockInput
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    await prisma.ingredientStock.upsert({
      where: {
        ingredientId_branchId: {
          ingredientId: input.ingredientId,
          branchId: input.branchId,
        },
      },
      create: {
        ingredientId: input.ingredientId,
        branchId: input.branchId,
        stock: Math.max(0, input.quantity),
        lastRestocked: input.quantity > 0 ? new Date() : null,
      },
      update: {
        stock: {
          increment: input.quantity,
        },
        ...(input.quantity > 0 && { lastRestocked: new Date() }),
      },
    });

    revalidatePath("/dashboard/ingredientes");
    revalidateTag("ingredients");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error adjusting ingredient stock:", error);
    return { success: false, error: "Error al ajustar el stock del ingrediente" };
  }
}

// ─── Recipe management ────────────────────────────────────────────────────────

export async function setProductRecipe(
  productId: string,
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    weightUnit?: string | null;
    volumeUnit?: string | null;
  }>
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.$transaction([
      prisma.productIngredient.deleteMany({ where: { productId } }),
      ...(ingredients.length > 0
        ? [
            prisma.productIngredient.createMany({
              data: ingredients.map((ing) => ({
                productId,
                ingredientId: ing.ingredientId,
                quantity: new Prisma.Decimal(ing.quantity.toString()),
                weightUnit: (ing.weightUnit as WeightUnit) ?? null,
                volumeUnit: (ing.volumeUnit as VolumeUnit) ?? null,
              })),
            }),
          ]
        : []),
    ]);

    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error setting product recipe:", error);
    return { success: false, error: "Error al guardar la receta del producto" };
  }
}

export async function getProductRecipe(
  productId: string
): Promise<ActionResult<ProductIngredientEntry[]>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const rows = await prisma.productIngredient.findMany({
      where: { productId },
      include: { ingredient: true },
      orderBy: { ingredient: { name: "asc" } },
    });

    return {
      success: true,
      data: rows.map((row) => ({
        ingredientId: row.ingredientId,
        ingredientName: row.ingredient.name,
        quantity: Number(row.quantity),
        unitType: row.ingredient.unitType,
        weightUnit: row.ingredient.weightUnit,
        volumeUnit: row.ingredient.volumeUnit,
        linkWeightUnit: row.weightUnit,
        linkVolumeUnit: row.volumeUnit,
        costPerUnit: Number(row.ingredient.costPerUnit),
      })),
    };
  } catch (error) {
    console.error("Error fetching product recipe:", error);
    return { success: false, error: "Error al obtener la receta del producto" };
  }
}

export async function calculateProductCost(
  productId: string
): Promise<ActionResult<{ recipeCost: number }>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const rows = await prisma.productIngredient.findMany({
      where: { productId },
      include: { ingredient: true },
    });

    const recipeCost = rows.reduce((sum, row) => {
      const baseQty = convertLinkQuantityToBase(
        Number(row.quantity),
        row.ingredient.unitType,
        row.weightUnit,
        row.volumeUnit,
        row.ingredient.weightUnit,
        row.ingredient.volumeUnit
      );
      return sum + baseQty * Number(row.ingredient.costPerUnit);
    }, 0);

    return { success: true, data: { recipeCost } };
  } catch (error) {
    console.error("Error calculating product cost:", error);
    return { success: false, error: "Error al calcular el costo del producto" };
  }
}

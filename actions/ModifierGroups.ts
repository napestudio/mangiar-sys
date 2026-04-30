"use server";

import { Prisma, UserRole } from "@/app/generated/prisma";
import { authorizeAction } from "@/lib/permissions/middleware";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

import type { ActionResult } from "@/types/action-result";
import type {
  AttachModifierGroupInput,
  CreateModifierGroupInput,
  CreateModifierOptionInput,
  ModifierGroupWithOptions,
  ModifierOptionData,
  ResolvedModifierGroup,
  UpdateModifierGroupInput,
  UpdateModifierOptionInput,
} from "@/types/modifiers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeOption(raw: {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: Prisma.Decimal;
  isDefault: boolean;
  isAvailable: boolean;
  order: number;
  ingredientLinks: Array<{
    ingredientId: string;
    weightUnit: string | null;
    volumeUnit: string | null;
    ingredient: {
      name: string;
      unitType: string;
      weightUnit: string | null;
      volumeUnit: string | null;
    };
    quantity: Prisma.Decimal;
  }>;
}): ModifierOptionData {
  return {
    id: raw.id,
    groupId: raw.groupId,
    name: raw.name,
    priceAdjustment: Number(raw.priceAdjustment),
    isDefault: raw.isDefault,
    isAvailable: raw.isAvailable,
    isOutOfStock: false,
    order: raw.order,
    ingredientLinks: raw.ingredientLinks.map((link) => ({
      ingredientId: link.ingredientId,
      ingredientName: link.ingredient.name,
      ingredientUnitType: link.ingredient.unitType as ModifierOptionData["ingredientLinks"][number]["ingredientUnitType"],
      quantity: Number(link.quantity),
      stock: 0,
      ingredientWeightUnit: link.ingredient.weightUnit as ModifierOptionData["ingredientLinks"][number]["ingredientWeightUnit"],
      ingredientVolumeUnit: link.ingredient.volumeUnit as ModifierOptionData["ingredientLinks"][number]["ingredientVolumeUnit"],
      weightUnit: link.weightUnit as ModifierOptionData["ingredientLinks"][number]["weightUnit"],
      volumeUnit: link.volumeUnit as ModifierOptionData["ingredientLinks"][number]["volumeUnit"],
    })),
  };
}

function serializeGroup(raw: {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  restaurantId: string;
  options: Parameters<typeof serializeOption>[0][];
}): ModifierGroupWithOptions {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    required: raw.required,
    minSelections: raw.minSelections,
    maxSelections: raw.maxSelections,
    restaurantId: raw.restaurantId,
    options: raw.options.map(serializeOption),
  };
}

const optionInclude = {
  ingredientLinks: {
    include: {
      ingredient: { select: { name: true, unitType: true, weightUnit: true, volumeUnit: true } },
    },
    orderBy: { ingredient: { name: "asc" } } as const,
  },
} as const;

const groupInclude = {
  options: {
    orderBy: { order: "asc" } as const,
    include: optionInclude,
  },
} as const;

// ─── Modifier Group CRUD ──────────────────────────────────────────────────────

export async function createModifierGroup(
  input: CreateModifierGroupInput
): Promise<ActionResult<ModifierGroupWithOptions>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    const group = await prisma.modifierGroup.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        required: input.required ?? false,
        minSelections: input.minSelections ?? 0,
        maxSelections: input.maxSelections ?? 1,
        restaurantId: input.restaurantId,
      },
      include: groupInclude,
    });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");

    return { success: true, data: serializeGroup(group) };
  } catch (error) {
    console.error("Error creating modifier group:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "Ya existe un grupo de modificadores con este nombre",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al crear el grupo de modificadores" };
  }
}

export async function updateModifierGroup(
  input: UpdateModifierGroupInput
): Promise<ActionResult<ModifierGroupWithOptions>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    const group = await prisma.modifierGroup.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.required !== undefined && { required: input.required }),
        ...(input.minSelections !== undefined && {
          minSelections: input.minSelections,
        }),
        ...(input.maxSelections !== undefined && {
          maxSelections: input.maxSelections,
        }),
      },
      include: groupInclude,
    });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");
    revalidateTag("products");

    return { success: true, data: serializeGroup(group) };
  } catch (error) {
    console.error("Error updating modifier group:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "Ya existe un grupo de modificadores con este nombre",
        };
      }
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Error al actualizar el grupo de modificadores",
    };
  }
}

export async function deleteModifierGroup(
  id: string
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.modifierGroup.delete({ where: { id } });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");
    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting modifier group:", error);
    return {
      success: false,
      error: "Error al eliminar el grupo de modificadores",
    };
  }
}

export async function getModifierGroupsByRestaurant(
  restaurantId: string
): Promise<ActionResult<ModifierGroupWithOptions[]>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const groups = await prisma.modifierGroup.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      include: groupInclude,
    });

    return { success: true, data: groups.map(serializeGroup) };
  } catch (error) {
    console.error("Error fetching modifier groups:", error);
    return {
      success: false,
      error: "Error al obtener los grupos de modificadores",
    };
  }
}

export async function getModifierGroupById(
  id: string
): Promise<ActionResult<ModifierGroupWithOptions>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const group = await prisma.modifierGroup.findUnique({
      where: { id },
      include: groupInclude,
    });

    if (!group) {
      return { success: false, error: "Grupo de modificadores no encontrado" };
    }

    return { success: true, data: serializeGroup(group) };
  } catch (error) {
    console.error("Error fetching modifier group:", error);
    return {
      success: false,
      error: "Error al obtener el grupo de modificadores",
    };
  }
}

// ─── Modifier Option CRUD ─────────────────────────────────────────────────────

export async function createModifierOption(
  input: CreateModifierOptionInput
): Promise<ActionResult<ModifierOptionData>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    // Determine next order value
    const maxOrder = await prisma.modifierOption.aggregate({
      where: { groupId: input.groupId },
      _max: { order: true },
    });

    const option = await prisma.modifierOption.create({
      data: {
        groupId: input.groupId,
        name: input.name,
        priceAdjustment: input.priceAdjustment ?? 0,
        isDefault: input.isDefault ?? false,
        isAvailable: input.isAvailable ?? true,
        order: input.order ?? (maxOrder._max.order ?? 0) + 1,
        ...(input.ingredientLinks && input.ingredientLinks.length > 0
          ? {
              ingredientLinks: {
                create: input.ingredientLinks.map((link) => ({
                  ingredientId: link.ingredientId,
                  quantity: new Prisma.Decimal(link.quantity.toString()),
                  weightUnit: link.weightUnit ?? null,
                  volumeUnit: link.volumeUnit ?? null,
                })),
              },
            }
          : {}),
      },
      include: optionInclude,
    });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");
    revalidateTag("products");

    return { success: true, data: serializeOption(option) };
  } catch (error) {
    console.error("Error creating modifier option:", error);
    return { success: false, error: "Error al crear la opción del modificador" };
  }
}

export async function updateModifierOption(
  input: UpdateModifierOptionInput
): Promise<ActionResult<ModifierOptionData>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    const option = await prisma.modifierOption.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.priceAdjustment !== undefined && {
          priceAdjustment: input.priceAdjustment,
        }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        ...(input.isAvailable !== undefined && {
          isAvailable: input.isAvailable,
        }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.ingredientLinks !== undefined
          ? {
              ingredientLinks: {
                deleteMany: {},
                ...(input.ingredientLinks.length > 0
                  ? {
                      create: input.ingredientLinks.map((link) => ({
                        ingredientId: link.ingredientId,
                        quantity: new Prisma.Decimal(link.quantity.toString()),
                        weightUnit: link.weightUnit ?? null,
                        volumeUnit: link.volumeUnit ?? null,
                      })),
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: optionInclude,
    });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");
    revalidateTag("products");

    return { success: true, data: serializeOption(option) };
  } catch (error) {
    console.error("Error updating modifier option:", error);
    return {
      success: false,
      error: "Error al actualizar la opción del modificador",
    };
  }
}

export async function deleteModifierOption(
  id: string
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.modifierOption.delete({ where: { id } });

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");
    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting modifier option:", error);
    return {
      success: false,
      error: "Error al eliminar la opción del modificador",
    };
  }
}

export async function reorderModifierOptions(
  groupId: string,
  orderedIds: string[]
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.modifierOption.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    revalidatePath("/dashboard/modificadores");
    revalidateTag("modifier-groups");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error reordering modifier options:", error);
    return { success: false, error: "Error al reordenar las opciones" };
  }
}

// ─── Product ↔ Modifier Group attachment ──────────────────────────────────────

export async function attachModifierGroupToProduct(
  input: AttachModifierGroupInput
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    // Determine next order
    const maxOrder = await prisma.productModifierGroup.aggregate({
      where: { productId: input.productId },
      _max: { order: true },
    });

    await prisma.productModifierGroup.upsert({
      where: {
        productId_groupId: {
          productId: input.productId,
          groupId: input.groupId,
        },
      },
      create: {
        productId: input.productId,
        groupId: input.groupId,
        order: input.order ?? (maxOrder._max.order ?? 0) + 1,
        requiredOverride: input.requiredOverride ?? null,
        minSelectionsOverride: input.minSelectionsOverride ?? null,
        maxSelectionsOverride: input.maxSelectionsOverride ?? null,
      },
      update: {
        ...(input.order !== undefined && { order: input.order }),
        requiredOverride: input.requiredOverride ?? null,
        minSelectionsOverride: input.minSelectionsOverride ?? null,
        maxSelectionsOverride: input.maxSelectionsOverride ?? null,
      },
    });

    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error attaching modifier group:", error);
    return {
      success: false,
      error: "Error al vincular el grupo de modificadores al producto",
    };
  }
}

export async function detachModifierGroupFromProduct(
  productId: string,
  groupId: string
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.productModifierGroup.deleteMany({
      where: { productId, groupId },
    });

    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error detaching modifier group:", error);
    return {
      success: false,
      error: "Error al desvincular el grupo de modificadores",
    };
  }
}

export async function reorderProductModifierGroups(
  productId: string,
  orderedGroupIds: string[]
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.$transaction(
      orderedGroupIds.map((groupId, index) =>
        prisma.productModifierGroup.updateMany({
          where: { productId, groupId },
          data: { order: index },
        })
      )
    );

    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error reordering product modifier groups:", error);
    return { success: false, error: "Error al reordenar los modificadores del producto" };
  }
}

export async function getProductModifierGroups(
  productId: string
): Promise<ActionResult<ResolvedModifierGroup[]>> {
  try {
    await authorizeAction(UserRole.MANAGER);

    const rows = await prisma.productModifierGroup.findMany({
      where: { productId },
      orderBy: { order: "asc" },
      include: {
        group: { include: groupInclude },
      },
    });

    const resolved: ResolvedModifierGroup[] = rows.map((row) => {
      const group = serializeGroup(row.group);
      const override = {
        requiredOverride: row.requiredOverride,
        minSelectionsOverride: row.minSelectionsOverride,
        maxSelectionsOverride: row.maxSelectionsOverride,
        order: row.order,
      };
      return {
        ...group,
        productOverride: override,
        effectiveRequired: override.requiredOverride ?? group.required,
        effectiveMin: override.minSelectionsOverride ?? group.minSelections,
        effectiveMax: override.maxSelectionsOverride ?? group.maxSelections,
      };
    });

    return { success: true, data: resolved };
  } catch (error) {
    console.error("Error fetching product modifier groups:", error);
    return {
      success: false,
      error: "Error al obtener los modificadores del producto",
    };
  }
}

export async function setProductModifierGroupsBulk(
  productId: string,
  groups: AttachModifierGroupInput[]
): Promise<ActionResult<void>> {
  try {
    await authorizeAction(UserRole.ADMIN);

    await prisma.$transaction([
      prisma.productModifierGroup.deleteMany({ where: { productId } }),
      ...(groups.length > 0
        ? [
            prisma.productModifierGroup.createMany({
              data: groups.map((g, index) => ({
                productId,
                groupId: g.groupId,
                order: g.order ?? index,
                requiredOverride: g.requiredOverride ?? null,
                minSelectionsOverride: g.minSelectionsOverride ?? null,
                maxSelectionsOverride: g.maxSelectionsOverride ?? null,
              })),
            }),
          ]
        : []),
    ]);

    revalidateTag("products");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error setting product modifier groups:", error);
    return {
      success: false,
      error: "Error al guardar los modificadores del producto",
    };
  }
}

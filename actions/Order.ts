"use server";

import prisma from "@/lib/prisma";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PriceType,
  UserRole,
  InvoiceStatus,
  type Product,
} from "@/app/generated/prisma";
import { calculateDiscountAmount } from "@/lib/discount";
import { convertLinkQuantityToBase } from "@/lib/unit-conversions";
import { serializeClient } from "@/lib/serializers";
import { serializeForClient } from "@/lib/serialize";
import {
  todayBoundsARDate,
  dateStringToTimestampBoundsAR,
} from "@/lib/date-utils";
import { authorizeAction } from "@/lib/permissions/middleware";
import { revalidatePath } from "next/cache";
import { unstable_cache } from "next/cache";
import type {
  DeliverySection,
  DeliveryElement,
  DeliveryProduct,
  OrderProduct,
} from "@/types/products";

// ============================================================================
// Helper Functions (internal, not exported)
// ============================================================================

/**
 * Validate table for order creation
 * Returns table data if valid, or error object if invalid
 */
async function validateTableForOrder(
  tableId: string,
  type: OrderType,
): Promise<
  | { success: true; table: { isShared: boolean; isActive: boolean } }
  | { success: false; error: string }
> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { isShared: true, isActive: true },
  });

  if (!table) {
    return { success: false, error: "Mesa no encontrada" };
  }

  if (!table.isActive) {
    return { success: false, error: "Mesa no activa" };
  }

  // Check if table already has an active order (only for non-shared tables with DINE_IN)
  if (!table.isShared && type === OrderType.DINE_IN) {
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: { in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] },
      },
    });

    if (existingOrder) {
      return { success: false, error: "Esta mesa ya tiene una orden activa" };
    }
  }

  return { success: true, table };
}

/**
 * Deduct ingredient stock for a single order item, including modifier option ingredients.
 * Must be called inside a Prisma transaction (tx).
 */
async function _deductIngredientStock(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  branchId: string,
  productId: string | null | undefined,
  itemQuantity: number,
  modifiers: SelectedModifier[]
): Promise<void> {
  // Deduct base product recipe ingredients
  if (productId) {
    const recipeRows = await tx.productIngredient.findMany({
      where: { productId },
      include: { ingredient: { select: { name: true } } },
    });
    for (const row of recipeRows) {
      const deductQty = Number(row.quantity) * itemQuantity;
      const stockRow = await tx.ingredientStock.findUnique({
        where: {
          ingredientId_branchId: {
            ingredientId: row.ingredientId,
            branchId,
          },
        },
      });
      const currentStock = stockRow ? Number(stockRow.stock) : 0;
      const newStock = currentStock - deductQty;
      if (newStock < 0) {
        throw new Error(
          `Stock insuficiente del ingrediente "${row.ingredient.name}"`
        );
      }
      await tx.ingredientStock.upsert({
        where: {
          ingredientId_branchId: {
            ingredientId: row.ingredientId,
            branchId,
          },
        },
        create: {
          ingredientId: row.ingredientId,
          branchId,
          stock: Math.max(0, -deductQty),
        },
        update: { stock: { decrement: deductQty } },
      });
    }
  }

  // Deduct modifier option ingredients
  for (const mod of modifiers) {
    const modIngredients = await tx.modifierOptionIngredient.findMany({
      where: { optionId: mod.modifierOptionId },
      include: {
        ingredient: {
          select: { name: true, unitType: true, weightUnit: true, volumeUnit: true },
        },
      },
    });
    for (const row of modIngredients) {
      const quantityInBase = convertLinkQuantityToBase(
        Number(row.quantity),
        row.ingredient.unitType,
        row.weightUnit,
        row.volumeUnit,
        row.ingredient.weightUnit,
        row.ingredient.volumeUnit,
      );
      const deductQty = quantityInBase * itemQuantity * (mod.quantity ?? 1);
      const stockRow = await tx.ingredientStock.findUnique({
        where: {
          ingredientId_branchId: {
            ingredientId: row.ingredientId,
            branchId,
          },
        },
      });
      const currentStock = stockRow ? Number(stockRow.stock) : 0;
      const newStock = currentStock - deductQty;
      if (newStock < 0) {
        throw new Error(
          `Stock insuficiente del ingrediente "${row.ingredient.name}"`
        );
      }
      await tx.ingredientStock.upsert({
        where: {
          ingredientId_branchId: {
            ingredientId: row.ingredientId,
            branchId,
          },
        },
        create: {
          ingredientId: row.ingredientId,
          branchId,
          stock: Math.max(0, -deductQty),
        },
        update: { stock: { decrement: deductQty } },
      });
    }
  }
}

// Internal types for batch stock deduction helpers
type IngredientDeductionItem = {
  productId: string | null | undefined;
  quantity: number;
  modifiers: SelectedModifier[];
};

type ComboDeductionItem = {
  productId: string;
  itemName: string;
  quantity: number;
};

/**
 * Batch version of _deductIngredientStock. Accepts all order items at once and
 * issues the minimum number of DB round-trips regardless of item count:
 *   - 2 parallel findMany (recipes + modifier ingredients)
 *   - 1 findMany for current stock
 *   - N upserts in parallel (N = unique ingredients, not items × ingredients)
 * Must be called inside a Prisma transaction (tx).
 */
async function _deductIngredientStockBatch(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  branchId: string,
  items: IngredientDeductionItem[]
): Promise<void> {
  if (items.length === 0) return;

  const productIds = [
    ...new Set(
      items.map((i) => i.productId).filter((id): id is string => !!id)
    ),
  ];
  const modifierOptionIds = [
    ...new Set(
      items.flatMap((i) => i.modifiers.map((m) => m.modifierOptionId))
    ),
  ];

  // 2 parallel queries instead of N × M sequential findMany calls
  const [recipeRows, modIngredientRows] = await Promise.all([
    productIds.length > 0
      ? tx.productIngredient.findMany({
          where: { productId: { in: productIds } },
          include: { ingredient: { select: { name: true } } },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof tx.productIngredient.findMany<{ include: { ingredient: { select: { name: true } } } }>>>),
    modifierOptionIds.length > 0
      ? tx.modifierOptionIngredient.findMany({
          where: { optionId: { in: modifierOptionIds } },
          include: {
            ingredient: {
              select: {
                name: true,
                unitType: true,
                weightUnit: true,
                volumeUnit: true,
              },
            },
          },
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof tx.modifierOptionIngredient.findMany<{ include: { ingredient: { select: { name: true; unitType: true; weightUnit: true; volumeUnit: true } } } }>>>),
  ]);

  // Build lookup maps: productId → recipe rows, optionId → modifier ingredient rows
  const recipeByProduct = new Map<string, typeof recipeRows>();
  for (const row of recipeRows) {
    const list = recipeByProduct.get(row.productId) ?? [];
    list.push(row);
    recipeByProduct.set(row.productId, list);
  }

  const modIngByOption = new Map<string, typeof modIngredientRows>();
  for (const row of modIngredientRows) {
    const list = modIngByOption.get(row.optionId) ?? [];
    list.push(row);
    modIngByOption.set(row.optionId, list);
  }

  // Accumulate total deduction per ingredient across all items
  const deductions = new Map<string, { total: number; name: string }>();
  const accrue = (ingredientId: string, name: string, qty: number) => {
    const existing = deductions.get(ingredientId);
    if (existing) {
      existing.total += qty;
    } else {
      deductions.set(ingredientId, { total: qty, name });
    }
  };

  for (const item of items) {
    if (item.productId) {
      for (const row of recipeByProduct.get(item.productId) ?? []) {
        accrue(
          row.ingredientId,
          row.ingredient.name,
          Number(row.quantity) * item.quantity
        );
      }
    }
    for (const mod of item.modifiers) {
      for (const row of modIngByOption.get(mod.modifierOptionId) ?? []) {
        const quantityInBase = convertLinkQuantityToBase(
          Number(row.quantity),
          row.ingredient.unitType,
          row.weightUnit,
          row.volumeUnit,
          row.ingredient.weightUnit,
          row.ingredient.volumeUnit
        );
        accrue(
          row.ingredientId,
          row.ingredient.name,
          quantityInBase * item.quantity * (mod.quantity ?? 1)
        );
      }
    }
  }

  if (deductions.size === 0) return;

  // 1 query to load all relevant stock rows
  const ingredientIds = [...deductions.keys()];
  const stockRows = await tx.ingredientStock.findMany({
    where: { ingredientId: { in: ingredientIds }, branchId },
  });
  const stockByIngredient = new Map<string, number>(
    stockRows.map((r) => [r.ingredientId, Number(r.stock)])
  );

  // Fail-fast validation before any write
  for (const [ingredientId, { total, name }] of deductions) {
    const current = stockByIngredient.get(ingredientId) ?? 0;
    if (current - total < 0) {
      throw new Error(`Stock insuficiente del ingrediente "${name}"`);
    }
  }

  // Parallel upserts — distinct rows, safe inside a transaction
  await Promise.all(
    [...deductions.entries()].map(([ingredientId, { total }]) =>
      tx.ingredientStock.upsert({
        where: { ingredientId_branchId: { ingredientId, branchId } },
        create: { ingredientId, branchId, stock: Math.max(0, -total) },
        update: { stock: { decrement: total } },
      })
    )
  );
}

/**
 * Handles stock deduction for combo product components in bulk.
 * Fetches all combo products in a single query instead of one findUnique per item,
 * deduplicates component deductions, then writes in parallel.
 * Must be called inside a Prisma transaction (tx).
 */
async function _deductComboComponentStock(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  branchId: string,
  items: ComboDeductionItem[]
): Promise<void> {
  if (items.length === 0) return;

  const productIds = [...new Set(items.map((i) => i.productId))];

  // 1 findMany instead of N findUnique calls
  const comboProducts = await tx.product.findMany({
    where: { id: { in: productIds }, isCombo: true },
    select: {
      id: true,
      comboComponents: {
        select: {
          componentId: true,
          quantity: true,
          component: {
            select: {
              trackStock: true,
              branches: {
                where: { branchId },
                select: { id: true, stock: true },
              },
            },
          },
        },
      },
    },
  });

  if (comboProducts.length === 0) return;

  const comboMap = new Map(comboProducts.map((p) => [p.id, p]));

  // Accumulate deductions per productOnBranch ID (deduplicates across items)
  const pobDeductions = new Map<
    string,
    {
      pobId: string;
      decrementQty: number;
      previousStock: number;
      comboProductId: string;
      itemName: string;
    }
  >();

  for (const item of items) {
    const combo = comboMap.get(item.productId);
    if (!combo) continue;
    for (const comp of combo.comboComponents) {
      if (!comp.component.trackStock) continue;
      const pob = comp.component.branches[0];
      if (!pob) continue;
      const decrementQty = Number(comp.quantity) * item.quantity;
      const existing = pobDeductions.get(pob.id);
      if (existing) {
        existing.decrementQty += decrementQty;
      } else {
        pobDeductions.set(pob.id, {
          pobId: pob.id,
          decrementQty,
          previousStock: Number(pob.stock),
          comboProductId: item.productId,
          itemName: item.itemName,
        });
      }
    }
  }

  // Fail-fast validation before any write
  for (const { previousStock, decrementQty, itemName } of pobDeductions.values()) {
    if (previousStock - decrementQty < 0) {
      throw new Error(
        `Stock insuficiente para el componente del combo "${itemName}"`
      );
    }
  }

  // Parallel writes per unique component
  await Promise.all(
    [...pobDeductions.values()].map(
      ({ pobId, decrementQty, previousStock, comboProductId }) => {
        const newStock = previousStock - decrementQty;
        return Promise.all([
          tx.productOnBranch.update({
            where: { id: pobId },
            data: { stock: newStock },
          }),
          tx.stockMovement.create({
            data: {
              productOnBranchId: pobId,
              quantity: -decrementQty,
              previousStock,
              newStock,
              reason: "Venta combo",
              reference: `COMBO:${comboProductId}`,
              notes: `Componente de combo vendido x${decrementQty}`,
            },
          }),
        ]);
      }
    )
  );
}

/**
 * Get client discount percentage and type
 * Returns 0 / PERCENTAGE defaults if client not found or no discount set
 */
async function getClientDiscount(
  clientId: string | null | undefined,
): Promise<{ discountPercentage: number; discountType: string }> {
  if (!clientId) return { discountPercentage: 0, discountType: "PERCENTAGE" };

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { discountPercentage: true, discountType: true },
  });

  return {
    discountPercentage: client?.discountPercentage
      ? Number(client.discountPercentage)
      : 0,
    discountType: String(client?.discountType || "PERCENTAGE"),
  };
}

// ============================================================================
// Types
// ============================================================================

import type {
  OrderItemInput,
  OrderFilters,
  PaymentMethodExtended,
  PaymentEntry,
  OrderWithoutInvoice,
  SelectedModifier,
} from "@/types/orders";
export type {
  OrderItemInput,
  OrderFilters,
  PaymentMethodExtended,
  PaymentEntry,
  OrderWithoutInvoice,
};

// Helper to serialize product (convert Decimal fields to numbers)
function serializeProduct(product: Product | null) {
  if (!product) return null;
  return {
    ...product,
    minStockAlert: product.minStockAlert ? Number(product.minStockAlert) : null,
  };
}

// Create a new order (any type)
export async function createOrder(data: {
  branchId: string;
  type: OrderType;
  tableId?: string | null;
  partySize?: number | null;
  clientId?: string | null;
  assignedToId?: string | null;
  description?: string | null;
  scheduledAt?: Date | null;
}) {
  try {
    const {
      branchId,
      type,
      tableId,
      partySize,
      clientId,
      assignedToId,
      description,
      scheduledAt,
    } = data;

    // Validation based on order type
    if (type === OrderType.DINE_IN && !tableId) {
      return {
        success: false,
        error: "Se requiere una mesa para órdenes para comer aquí",
      };
    }

    if (type === OrderType.DELIVERY && !clientId) {
      return {
        success: false,
        error: "Se requiere un cliente para órdenes de delivery",
      };
    }

    // Validate table for DINE_IN orders
    if (tableId) {
      const tableValidation = await validateTableForOrder(tableId, type);
      if (!tableValidation.success) {
        return { success: false, error: tableValidation.error };
      }
    }

    // Generate a unique public code
    const publicCode = `${type.charAt(0)}${Date.now().toString().slice(-8)}`;

    // Get client discount if clientId is provided
    const clientDiscount = await getClientDiscount(clientId);

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          branchId,
          tableId: tableId || null,
          partySize: partySize || null,
          type,
          publicCode,
          status: OrderStatus.PENDING,
          clientId: clientId || null,
          assignedToId: assignedToId || null,
          discountPercentage: clientDiscount.discountPercentage,
          discountType: clientDiscount.discountType as "PERCENTAGE" | "FIXED",
          description: description || null,
          scheduledAt: scheduledAt ?? null,
        },
        include: {
          items: {
            include: {
              product: true,
            },
            orderBy: {
              id: "asc",
            },
          },
          client: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          table: {
            select: {
              number: true,
              name: true,
              sectorId: true,
            },
          },
        },
      });

      // Update table status to OCCUPIED if it's a dine-in order
      if (tableId && type === OrderType.DINE_IN) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });
      }

      return newOrder;
    });

    return {
      success: true,
      data: serializeForClient(order),
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Error al crear la orden",
    };
  }
}

// Create a new order with items in a single transaction (bulk insert)
export async function createOrderWithItems(data: {
  branchId: string;
  type: OrderType;
  tableId?: string | null;
  partySize?: number | null;
  clientId?: string | null;
  assignedToId?: string | null;
  description?: string | null;
  items: OrderItemInput[];
  deliveryFee?: number;
  scheduledAt?: Date | null;
}) {
  try {
    const {
      branchId,
      type,
      tableId,
      partySize,
      clientId,
      assignedToId,
      description,
      items,
      deliveryFee,
      scheduledAt,
    } = data;

    // Validation: at least one item required
    if (!items || items.length === 0) {
      return {
        success: false,
        error: "Se requiere al menos un producto",
      };
    }

    // Validation based on order type
    if (type === OrderType.DINE_IN && !tableId) {
      return {
        success: false,
        error: "Se requiere una mesa para órdenes para comer aquí",
      };
    }

    if (type === OrderType.DELIVERY && !clientId) {
      return {
        success: false,
        error: "Se requiere un cliente para órdenes de delivery",
      };
    }

    // Validate table for DINE_IN orders
    if (tableId) {
      const tableValidation = await validateTableForOrder(tableId, type);
      if (!tableValidation.success) {
        return { success: false, error: tableValidation.error };
      }
    }

    // Generate a unique public code
    const publicCode = `${type.charAt(0)}${Date.now().toString().slice(-8)}`;

    // Get client discount if clientId is provided
    const clientDiscount = await getClientDiscount(clientId);

    // Create order and items in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          branchId,
          tableId: tableId || null,
          partySize: partySize || null,
          type,
          publicCode,
          status: OrderStatus.PENDING,
          clientId: clientId || null,
          assignedToId: assignedToId || null,
          discountPercentage: clientDiscount.discountPercentage,
          discountType: clientDiscount.discountType as "PERCENTAGE" | "FIXED",
          deliveryFee: deliveryFee ?? 0,
          description: description || null,
          scheduledAt: scheduledAt ?? null,
        },
      });

      // Create order items — use individual creates when any item has modifiers
      const hasModifiers = items.some(
        (item) => item.modifiers && item.modifiers.length > 0
      );
      if (hasModifiers) {
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              itemName: item.itemName,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice,
              notes: item.notes || null,
              ...(item.modifiers && item.modifiers.length > 0
                ? {
                    modifiers: {
                      create: item.modifiers.map((mod) => ({
                        modifierOptionId: mod.modifierOptionId,
                        optionName: mod.optionName,
                        groupName: mod.groupName,
                        priceAdjustment: mod.priceAdjustment,
                        quantity: mod.quantity ?? 1,
                      })),
                    },
                  }
                : {}),
            },
          });
        }
      } else {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            notes: item.notes || null,
          })),
        });
      }

      // Deduct ingredient stock for product recipes and modifier options
      await _deductIngredientStockBatch(
        tx,
        branchId,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers ?? [],
        }))
      );

      // Auto-decrement component stocks for combo products
      await _deductComboComponentStock(
        tx,
        branchId,
        items
          .filter(
            (item): item is typeof item & { productId: string } =>
              !!item.productId
          )
          .map((item) => ({
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
          }))
      );

      // Update table status to OCCUPIED if it's a dine-in order
      if (tableId && type === OrderType.DINE_IN) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });
      }

      // Fetch the complete order with items
      const completeOrder = await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              product: true,
              modifiers: true,
            },
            orderBy: {
              id: "asc",
            },
          },
          client: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          table: {
            select: {
              number: true,
              name: true,
              sectorId: true,
            },
          },
        },
      });

      return completeOrder;
    });

    if (!order) {
      return {
        success: false,
        error: "Error al crear la orden",
      };
    }

    return {
      success: true,
      data: serializeForClient(order),
    };
  } catch (error) {
    console.error("Error creating order with items:", error);
    return {
      success: false,
      error: "Error al crear la orden",
    };
  }
}

// Create a new dine-in order for a table
export async function createTableOrder(
  tableId: string,
  branchId: string,
  partySize: number,
  clientId?: string | null,
  assignedToId?: string | null,
) {
  try {
    // Validate table for order
    const tableValidation = await validateTableForOrder(
      tableId,
      OrderType.DINE_IN,
    );
    if (!tableValidation.success) {
      return { success: false, error: tableValidation.error };
    }

    // Generate a unique public code
    const publicCode = `MGR${Date.now().toString().slice(-8)}`;

    // Get client discount if clientId is provided
    const clientDiscount = await getClientDiscount(clientId);

    // Create order and update table status in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          branchId,
          tableId,
          partySize,
          type: OrderType.DINE_IN,
          publicCode,
          status: OrderStatus.PENDING,
          clientId: clientId || null,
          assignedToId: assignedToId || null,
          discountPercentage: clientDiscount.discountPercentage,
          discountType: clientDiscount.discountType as "PERCENTAGE" | "FIXED",
        },
        include: {
          items: {
            include: {
              product: true,
            },
            orderBy: {
              id: "asc",
            },
          },
          client: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Update table status to OCCUPIED
      await tx.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" },
      });

      return newOrder;
    });

    // Convert Decimal fields to numbers (empty items array for new order, but keep consistency)
    const serializedOrder = {
      ...order,
      discountPercentage: Number(order.discountPercentage),
      deliveryFee: Number(order.deliveryFee),
      client: order.client ? serializeClient(order.client) : null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        product: serializeProduct(item.product),
      })),
    };

    return {
      success: true,
      data: serializedOrder,
    };
  } catch (error) {
    console.error("Error creating table order:", error);
    return {
      success: false,
      error: "Error al crear la orden",
    };
  }
}

// Get active order for a table
// For shared tables, this returns the most recent order
export async function getTableOrder(tableId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        tableId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: true,
          },
          orderBy: {
            id: "asc",
          },
        },
        client: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        invoices: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal fields to numbers for client components
    const serializedOrder = order
      ? {
          ...order,
          discountPercentage: Number(order.discountPercentage),
          deliveryFee: Number(order.deliveryFee),
          items: order.items.map((item) => ({
            ...item,
            price: Number(item.price),
            originalPrice: item.originalPrice
              ? Number(item.originalPrice)
              : null,
            product: serializeProduct(item.product),
            modifiers: item.modifiers.map((m) => ({
              id: m.id,
              optionName: m.optionName,
              groupName: m.groupName,
              priceAdjustment: Number(m.priceAdjustment),
            })),
          })),
          invoices: order.invoices || [],
          client: order.client
            ? {
                id: order.client.id,
                name: order.client.name,
                email: order.client.email,
              }
            : null,
          assignedTo: order.assignedTo
            ? {
                id: order.assignedTo.id,
                name: order.assignedTo.name,
                username: order.assignedTo.username,
              }
            : null,
        }
      : null;

    return {
      success: true,
      data: serializedOrder,
    };
  } catch (error) {
    console.error("Error getting table order:", error);
    return {
      success: false,
      error: "Error al obtener la orden",
    };
  }
}

// Get all active orders for a table (useful for shared tables)
export async function getTableOrders(tableId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
        },
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: true,
          },
          orderBy: {
            id: "asc",
          },
        },
        client: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        invoices: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal fields to numbers for client components
    const serializedOrders = orders.map((order) => ({
      ...order,
      discountPercentage: Number(order.discountPercentage),
      deliveryFee: Number(order.deliveryFee),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        product: serializeProduct(item.product),
        modifiers: item.modifiers.map((m) => ({
          id: m.id,
          optionName: m.optionName,
          groupName: m.groupName,
          priceAdjustment: Number(m.priceAdjustment),
        })),
      })),
      invoices: order.invoices || [],
      client: order.client
        ? {
            id: order.client.id,
            name: order.client.name,
            email: order.client.email,
          }
        : null,
      assignedTo: order.assignedTo
        ? {
            id: order.assignedTo.id,
            name: order.assignedTo.name,
            username: order.assignedTo.username,
          }
        : null,
    }));

    return {
      success: true,
      data: serializedOrders,
    };
  } catch (error) {
    console.error("Error getting table orders:", error);
    return {
      success: false,
      error: "Error al obtener las órdenes",
    };
  }
}

// Add item to order
export async function addOrderItem(orderId: string, item: OrderItemInput) {
  try {
    // Fetch the order's branchId for combo stock decrement
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true },
    });
    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }
    const branchId = order.branchId;

    const orderItem = await prisma.$transaction(async (tx) => {
      const created = await tx.orderItem.create({
        data: {
          orderId,
          productId: item.productId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          notes: item.notes || null,
          ...(item.modifiers && item.modifiers.length > 0
            ? {
                modifiers: {
                  create: item.modifiers.map((mod) => ({
                    modifierOptionId: mod.modifierOptionId,
                    optionName: mod.optionName,
                    groupName: mod.groupName,
                    priceAdjustment: mod.priceAdjustment,
                  })),
                },
              }
            : {}),
        },
        include: { product: true, modifiers: true },
      });

      // Deduct ingredient stock
      await _deductIngredientStock(
        tx,
        branchId,
        item.productId,
        item.quantity,
        item.modifiers ?? []
      );

      // Auto-decrement component stocks for combo products
      if (item.productId) {
        await _deductComboComponentStock(tx, branchId, [
          {
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
          },
        ]);
      }

      return created;
    });

    // Convert Decimal to number
    const serializedItem = {
      ...orderItem,
      price: Number(orderItem.price),
      originalPrice: orderItem.originalPrice
        ? Number(orderItem.originalPrice)
        : null,
      product: serializeProduct(orderItem.product),
      modifiers: orderItem.modifiers.map((mod) => ({
        id: mod.id,
        optionName: mod.optionName,
        groupName: mod.groupName,
        priceAdjustment: Number(mod.priceAdjustment),
      })),
    };

    return {
      success: true,
      data: serializedItem,
    };
  } catch (error) {
    console.error("Error adding order item:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al agregar el producto",
    };
  }
}

// Add multiple items to order (bulk operation)
export async function addOrderItems(orderId: string, items: OrderItemInput[]) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true },
    });
    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }
    const branchId = order.branchId;

    const updatedItems = await prisma.$transaction(async (tx) => {
      const hasModifiers = items.some(
        (item) => item.modifiers && item.modifiers.length > 0
      );
      if (hasModifiers) {
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              itemName: item.itemName,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice,
              notes: item.notes || null,
              ...(item.modifiers && item.modifiers.length > 0
                ? {
                    modifiers: {
                      create: item.modifiers.map((mod) => ({
                        modifierOptionId: mod.modifierOptionId,
                        optionName: mod.optionName,
                        groupName: mod.groupName,
                        priceAdjustment: mod.priceAdjustment,
                        quantity: mod.quantity ?? 1,
                      })),
                    },
                  }
                : {}),
            },
          });
        }
      } else {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId,
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            notes: item.notes || null,
          })),
        });
      }

      // Deduct ingredient stock for each item
      await _deductIngredientStockBatch(
        tx,
        branchId,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers ?? [],
        }))
      );

      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: true, modifiers: true },
        orderBy: { id: "asc" },
      });

      return allItems.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice:
          item.originalPrice !== null ? Number(item.originalPrice) : null,
        product: serializeProduct(item.product),
        modifiers: item.modifiers.map((mod) => ({
          id: mod.id,
          optionName: mod.optionName,
          groupName: mod.groupName,
          priceAdjustment: Number(mod.priceAdjustment),
        })),
      }));
    });

    return { success: true, data: updatedItems };
  } catch (error) {
    console.error("Error adding order items:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al agregar los productos",
    };
  }
}

// Update order item price
export async function updateOrderItemPrice(itemId: string, price: number) {
  try {
    // Authorization check - only MANAGER and above can modify order prices
    await authorizeAction(
      UserRole.MANAGER,
      "Solo gerentes y superiores pueden modificar precios",
    );

    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { price },
      include: {
        product: true,
      },
    });

    // Convert Decimal to number
    const serializedItem = {
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      product: serializeProduct(item.product),
    };

    return {
      success: true,
      data: serializedItem,
    };
  } catch (error) {
    console.error("Error updating order item price:", error);
    return {
      success: false,
      error: "Error al actualizar el precio",
    };
  }
}

// Update order item quantity
export async function updateOrderItemQuantity(
  itemId: string,
  quantity: number,
) {
  try {
    // Validate quantity is positive
    if (quantity < 1) {
      return {
        success: false,
        error: "La cantidad debe ser mayor a 0",
      };
    }

    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true,
      },
    });

    // Convert Decimal to number
    const serializedItem = {
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      product: serializeProduct(item.product),
    };

    return {
      success: true,
      data: serializedItem,
    };
  } catch (error) {
    console.error("Error updating order item quantity:", error);
    return {
      success: false,
      error: "Error al actualizar la cantidad",
    };
  }
}

// Update order item notes
export async function updateOrderItemNotes(
  itemId: string,
  notes: string | null,
) {
  try {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { notes },
      include: {
        product: true,
      },
    });

    // Convert Decimal to number
    const serializedItem = {
      ...item,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      product: serializeProduct(item.product),
    };

    return {
      success: true,
      data: serializedItem,
    };
  } catch (error) {
    console.error("Error updating order item notes:", error);
    return {
      success: false,
      error: "Error al actualizar las notas",
    };
  }
}

// Remove item from order
export async function removeOrderItem(itemId: string) {
  try {
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing order item:", error);
    return {
      success: false,
      error: "Error al eliminar el producto",
    };
  }
}

// Update party size
export async function updatePartySize(orderId: string, partySize: number) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { partySize },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error updating party size:", error);
    return {
      success: false,
      error: "Error al actualizar el número de comensales",
    };
  }
}

// Close table (mark order as completed)
export async function closeTable(orderId: string) {
  try {
    // Update order and check table status in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // First, get the order to check its tableId
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { tableId: true },
      });

      const previousTableId = existingOrder?.tableId;

      // Mark order as completed
      const completedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
        },
        include: {
          items: {
            include: {
              product: true,
            },
            orderBy: {
              id: "asc",
            },
          },
          table: true,
        },
      });

      // Check if table has any other active orders
      if (previousTableId) {
        const activeOrders = await tx.order.count({
          where: {
            tableId: previousTableId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
        });

        // If no more active orders, clear table status
        if (activeOrders === 0) {
          await tx.table.update({
            where: { id: previousTableId },
            data: { status: "EMPTY" },
          });
        }
      }

      return completedOrder;
    });

    // Convert Decimal fields to numbers
    const serializedOrder = {
      ...order,
      discountPercentage: Number(order.discountPercentage),
      deliveryFee: Number(order.deliveryFee),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        product: serializeProduct(item.product),
      })),
    };

    return {
      success: true,
      data: serializedOrder,
    };
  } catch (error) {
    console.error("Error closing table:", error);
    return {
      success: false,
      error: "Error al cerrar la mesa",
    };
  }
}

// Close table by deleting an empty order (no items)
export async function closeEmptyTable(orderId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the order with its items count
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      if (!order) {
        throw new Error("Orden no encontrada");
      }

      // Verify order has no items
      if (order._count.items > 0) {
        throw new Error(
          "No se puede eliminar una orden con productos. Use el cierre de mesa normal.",
        );
      }

      const previousTableId = order.tableId;

      // Delete the empty order
      await tx.order.delete({
        where: { id: orderId },
      });

      // Check if table has any other active orders and set to EMPTY if not
      if (previousTableId) {
        const activeOrders = await tx.order.count({
          where: {
            tableId: previousTableId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
        });

        if (activeOrders === 0) {
          await tx.table.update({
            where: { id: previousTableId },
            data: { status: "EMPTY" },
          });
        }
      }

      return { tableId: previousTableId };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error closing empty table:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cerrar la mesa",
    };
  }
}

// Check if table has active orders
export async function tableHasActiveOrders(tableId: string) {
  try {
    const count = await prisma.order.count({
      where: {
        tableId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
        },
      },
    });

    return {
      success: true,
      hasActiveOrders: count > 0,
      count,
    };
  } catch (error) {
    console.error("Error checking table orders:", error);
    return {
      success: false,
      hasActiveOrders: false,
      count: 0,
    };
  }
}

// Get products available for ordering (branch-specific with prices)
async function _getAvailableProductsForOrder(
  branchId: string,
  orderType: OrderType = OrderType.DINE_IN,
) {
  try {
    // COUNTER orders use TAKE_AWAY pricing
    const effectiveOrderType =
      orderType === OrderType.COUNTER ? OrderType.TAKE_AWAY : orderType;

    // Map OrderType to PriceType (PriceType has no COUNTER value)
    const effectivePriceType =
      effectiveOrderType === OrderType.TAKE_AWAY
        ? PriceType.TAKE_AWAY
        : effectiveOrderType === OrderType.DELIVERY
          ? PriceType.DELIVERY
          : PriceType.DINE_IN;

    // Build price type filter: fetch requested type + DINE_IN for fallback
    const priceTypes: PriceType[] =
      effectivePriceType === PriceType.DINE_IN
        ? [PriceType.DINE_IN]
        : [effectivePriceType, PriceType.DINE_IN];

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        branches: {
          some: {
            branchId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        tags: true,
        trackStock: true,
        isCombo: true,
        category: {
          select: {
            name: true,
          },
        },
        branches: {
          where: {
            branchId,
          },
          select: {
            stock: true,
            prices: {
              where: {
                type: {
                  in: priceTypes, // Only fetch needed price types
                },
              },
              select: {
                price: true,
                type: true,
              },
            },
          },
        },
        comboComponents: {
          select: {
            quantity: true,
            component: {
              select: {
                trackStock: true,
                branches: {
                  where: { branchId },
                  select: { stock: true },
                },
              },
            },
          },
        },
        modifierGroups: {
          orderBy: { order: "asc" },
          select: {
            order: true,
            requiredOverride: true,
            minSelectionsOverride: true,
            maxSelectionsOverride: true,
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                required: true,
                minSelections: true,
                maxSelections: true,
                restaurantId: true,
                options: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    groupId: true,
                    name: true,
                    priceAdjustment: true,
                    isDefault: true,
                    isAvailable: true,
                    order: true,
                    ingredientLinks: {
                      select: {
                        ingredientId: true,
                        quantity: true,
                        weightUnit: true,
                        volumeUnit: true,
                        ingredient: {
                          select: {
                            name: true,
                            unitType: true,
                            weightUnit: true,
                            volumeUnit: true,
                            branchStock: {
                              where: { branchId },
                              select: { stock: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          category: {
            order: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    // Transform to include price directly and convert Decimal to number
    const productsWithPrice = products
      .map((product) => {
        const branchPrices = product.branches[0]?.prices || [];

        // Try to find price matching effectivePriceType (COUNTER maps to TAKE_AWAY)
        let priceObj = branchPrices.find((p) => p.type === effectivePriceType);

        // Fallback to DINE_IN if effectivePriceType price not found
        if (!priceObj && effectivePriceType !== PriceType.DINE_IN) {
          priceObj = branchPrices.find((p) => p.type === PriceType.DINE_IN);
        }

        // For combos, compute availability from component stocks
        let comboAvailability: number | undefined = undefined;
        if (product.isCombo) {
          if (product.comboComponents.length === 0) {
            comboAvailability = 0;
          } else {
            let minAvail = Infinity;
            for (const comp of product.comboComponents) {
              if (!comp.component.trackStock) continue; // untracked = unlimited
              const compStock = Number(comp.component.branches[0]?.stock ?? 0);
              const qty = Number(comp.quantity);
              if (qty <= 0) continue;
              minAvail = Math.min(minAvail, Math.floor(compStock / qty));
            }
            comboAvailability = isFinite(minAvail) ? minAvail : undefined;
          }
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          tags: product.tags,
          category: product.category,
          price: Number(priceObj?.price ?? 0),
          trackStock: product.trackStock,
          stock: Number(product.branches[0]?.stock ?? 0),
          isCombo: product.isCombo,
          comboAvailability,
          modifierGroups: product.modifierGroups.map((mg) => ({
            id: mg.group.id,
            name: mg.group.name,
            description: mg.group.description,
            required: mg.group.required,
            minSelections: mg.group.minSelections,
            maxSelections: mg.group.maxSelections,
            restaurantId: mg.group.restaurantId,
            options: mg.group.options.map((opt) => {
              const isOutOfStock = opt.ingredientLinks.some((link) => {
                const stock = Number(link.ingredient.branchStock[0]?.stock ?? 0);
                const required = convertLinkQuantityToBase(
                  Number(link.quantity),
                  link.ingredient.unitType,
                  link.weightUnit,
                  link.volumeUnit,
                  link.ingredient.weightUnit,
                  link.ingredient.volumeUnit,
                );
                return stock < required;
              });
              return {
                id: opt.id,
                groupId: opt.groupId,
                name: opt.name,
                priceAdjustment: Number(opt.priceAdjustment),
                isDefault: opt.isDefault,
                isAvailable: opt.isAvailable,
                isOutOfStock,
                order: opt.order,
                ingredientLinks: opt.ingredientLinks.map((link) => ({
                  ingredientId: link.ingredientId,
                  ingredientName: link.ingredient.name,
                  ingredientUnitType: link.ingredient.unitType,
                  quantity: Number(link.quantity),
                  stock: Number(link.ingredient.branchStock[0]?.stock ?? 0),
                  ingredientWeightUnit: link.ingredient.weightUnit,
                  ingredientVolumeUnit: link.ingredient.volumeUnit,
                  weightUnit: link.weightUnit,
                  volumeUnit: link.volumeUnit,
                })),
              };
            }),
            productOverride: {
              requiredOverride: mg.requiredOverride,
              minSelectionsOverride: mg.minSelectionsOverride,
              maxSelectionsOverride: mg.maxSelectionsOverride,
              order: mg.order,
            },
            effectiveRequired: mg.requiredOverride ?? mg.group.required,
            effectiveMin:
              mg.minSelectionsOverride ?? mg.group.minSelections,
            effectiveMax:
              mg.maxSelectionsOverride ?? mg.group.maxSelections,
          })),
        };
      })
      .filter((p) => {
        if (p.isCombo) return p.comboAvailability === undefined || p.comboAvailability > 0;
        return !p.trackStock || p.stock > 0;
      });

    return productsWithPrice;
  } catch (error) {
    console.error("Error getting available products:", error);
    return [];
  }
}

export const getAvailableProductsForOrder = unstable_cache(
  _getAvailableProductsForOrder,
  ["available-products-for-order"],
  { tags: ["products"], revalidate: 60 }
);

// Get products for a specific delivery menu, organised by menu sections and groups.
// Returns both the section structure (for display) and a flat deduped product list
// (for cart stock lookups).
export async function getProductsForDeliveryMenu(
  branchId: string,
  menuId: string,
  orderType: OrderType = OrderType.DELIVERY,
): Promise<{ sections: DeliverySection[]; products: OrderProduct[] }> {
  try {
    const priceTypes: PriceType[] =
      orderType === OrderType.DINE_IN
        ? [PriceType.DINE_IN]
        : orderType === OrderType.TAKE_AWAY
          ? [PriceType.TAKE_AWAY, PriceType.DINE_IN]
          : [PriceType.DELIVERY, PriceType.DINE_IN];

    const productSelect = {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      categoryId: true,
      tags: true,
      trackStock: true,
      category: { select: { name: true } },
      branches: {
        where: { branchId },
        select: {
          stock: true,
          prices: {
            where: { type: { in: priceTypes } },
            select: { price: true, type: true },
          },
        },
      },
    };

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        menuSections: {
          orderBy: { order: "asc" },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { order: "asc" },
              include: { product: { select: productSelect } },
            },
            menuItemGroups: {
              orderBy: { order: "asc" },
              include: {
                menuItems: {
                  where: { isAvailable: true },
                  orderBy: { order: "asc" },
                  include: { product: { select: productSelect } },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) return { sections: [], products: [] };

    const resolvePrice = (
      rawProduct: (typeof menu.menuSections)[0]["menuItems"][0]["product"],
    ): DeliveryProduct => {
      const branchPrices = rawProduct.branches[0]?.prices || [];
      let priceObj = branchPrices.find((p) => p.type === orderType);
      if (!priceObj && orderType !== OrderType.DINE_IN) {
        priceObj = branchPrices.find((p) => p.type === OrderType.DINE_IN);
      }
      return {
        productId: rawProduct.id,
        name: rawProduct.name,
        description: rawProduct.description,
        imageUrl: rawProduct.imageUrl,
        price: Number(priceObj?.price ?? 0),
        tags: rawProduct.tags,
        trackStock: rawProduct.trackStock,
        stock: Number(rawProduct.branches[0]?.stock ?? 0),
        isFeatured: false, // overridden per-item below
      };
    };

    // Build section structure
    const sections: DeliverySection[] = menu.menuSections.map((section) => {
      const elements: DeliveryElement[] = [];

      // Direct (ungrouped) items — filter by menuItemGroupId is null at DB level
      // but Prisma returns all menuItems; group items are excluded via menuItemGroupId
      for (const item of section.menuItems.filter(
        (i) => i.menuItemGroupId === null,
      )) {
        const dp: DeliveryProduct = {
          ...resolvePrice(item.product),
          isFeatured: item.isFeatured,
        };
        if (!item.product.trackStock || dp.stock > 0) {
          elements.push({ type: "item", order: item.order, data: dp });
        }
      }

      // Groups
      for (const group of section.menuItemGroups) {
        const groupItems: DeliveryProduct[] = group.menuItems
          .map((item) => ({
            ...resolvePrice(item.product),
            isFeatured: item.isFeatured,
          }))
          .filter((dp) => !dp.trackStock || dp.stock > 0);

        if (groupItems.length > 0) {
          elements.push({
            type: "group",
            order: group.order,
            data: {
              id: group.id,
              name: group.name,
              description: group.description,
              order: group.order,
              items: groupItems,
            },
          });
        }
      }

      elements.sort((a, b) => a.order - b.order);

      return {
        id: section.id,
        name: section.name,
        description: section.description,
        order: section.order,
        elements,
      };
    });

    // Derive a flat, deduped OrderProduct list for cart stock lookups
    const seen = new Set<string>();
    const products: OrderProduct[] = [];
    for (const section of sections) {
      for (const element of section.elements) {
        const items =
          element.type === "item" ? [element.data] : element.data.items;
        for (const dp of items) {
          if (!seen.has(dp.productId)) {
            seen.add(dp.productId);
            products.push({
              id: dp.productId,
              name: dp.name,
              description: dp.description,
              imageUrl: dp.imageUrl,
              categoryId: null,
              category: null,
              price: dp.price,
              tags: dp.tags,
              trackStock: dp.trackStock,
              stock: dp.stock,
              isCombo: false,
            });
          }
        }
      }
    }

    return { sections, products };
  } catch (error) {
    console.error("Error getting delivery menu products:", error);
    return { sections: [], products: [] };
  }
}

// Get available tables to move an order to
// Only returns tables that are free (EMPTY status) and not reserved
export async function getAvailableTablesForMove(branchId: string) {
  try {
    const { start: today, end: tomorrow } = todayBoundsARDate();

    const tables = await prisma.table.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        reservations: {
          where: {
            reservation: {
              date: {
                gte: today,
                lt: tomorrow,
              },
              status: {
                in: ["CONFIRMED", "SEATED"],
              },
            },
          },
          include: {
            reservation: {
              include: {
                timeSlot: true,
              },
            },
          },
        },
        orders: {
          where: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
        },
      },
      orderBy: {
        number: "asc",
      },
    });

    // Filter out tables that have active orders or are currently reserved
    const now = new Date();
    const availableTables = tables.filter((table) => {
      // Non-shared tables must not have active orders
      // Shared tables can have multiple active orders
      if (!table.isShared && table.orders.length > 0) {
        return false;
      }

      // Table must not have active reservations for current time
      const hasActiveReservation = table.reservations.some((rt) => {
        const reservation = rt.reservation;
        if (!reservation.timeSlot) return false;

        const timeSlotStart = new Date(reservation.timeSlot.startTime);
        const timeSlotEnd = new Date(reservation.timeSlot.endTime);

        const startHour = timeSlotStart.getUTCHours();
        const startMinute = timeSlotStart.getUTCMinutes();
        const endHour = timeSlotEnd.getUTCHours();
        const endMinute = timeSlotEnd.getUTCMinutes();

        const reservationDate = new Date(reservation.date);
        const startTime = new Date(reservationDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(reservationDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        return now >= startTime && now <= endTime;
      });

      return !hasActiveReservation;
    });

    // Return simplified table data
    return availableTables.map((table) => ({
      id: table.id,
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      isShared: table.isShared,
      sectorId: table.sectorId,
    }));
  } catch (error) {
    console.error("Error getting available tables for move:", error);
    return [];
  }
}

// Move an order to a different table
export async function moveOrderToTable(orderId: string, targetTableId: string) {
  try {
    // Validate the order exists and is active
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Orden no encontrada",
      };
    }

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELED
    ) {
      return {
        success: false,
        error: "No se puede mover una orden completada o cancelada",
      };
    }

    if (!order.tableId) {
      return {
        success: false,
        error: "Esta orden no está asignada a ninguna mesa",
      };
    }

    if (order.tableId === targetTableId) {
      return {
        success: false,
        error: "La orden ya está en esta mesa",
      };
    }

    // Validate target table exists and is available
    const targetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
      include: {
        orders: {
          where: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
        },
      },
    });

    if (!targetTable) {
      return {
        success: false,
        error: "Mesa de destino no encontrada",
      };
    }

    if (!targetTable.isActive) {
      return {
        success: false,
        error: "Mesa de destino no está activa",
      };
    }

    // For non-shared tables, check if it already has an active order
    if (!targetTable.isShared && targetTable.orders.length > 0) {
      return {
        success: false,
        error: "La mesa de destino ya tiene una orden activa",
      };
    }

    const sourceTableId = order.tableId;

    // Move order in a transaction
    await prisma.$transaction(async (tx) => {
      // Update order to new table
      await tx.order.update({
        where: { id: orderId },
        data: { tableId: targetTableId },
      });

      // Update target table status to OCCUPIED
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: "OCCUPIED" },
      });

      // Check if source table has any other active orders
      const remainingOrders = await tx.order.count({
        where: {
          tableId: sourceTableId,
          status: {
            in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
          },
        },
      });

      // If no more active orders on source table, set it to EMPTY
      if (remainingOrders === 0) {
        await tx.table.update({
          where: { id: sourceTableId },
          data: { status: "EMPTY" },
        });
      }
    });

    return {
      success: true,
      data: {
        orderId,
        sourceTableId,
        targetTableId,
      },
    };
  } catch (error) {
    console.error("Error moving order to table:", error);
    return {
      success: false,
      error: "Error al mover la orden",
    };
  }
}

// Filters for getting orders

// Get orders with filters and pagination
export async function getOrders(filters: OrderFilters) {
  try {
    const {
      branchId,
      startDate,
      endDate,
      status,
      tableId,
      type,
      paymentMethod,
      search,
      page = 1,
      pageSize = 10,
      sortOrder = "desc",
    } = filters;

    // Build where clause
    type WhereClause = {
      branchId: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
        lt?: Date;
      };
      status?: OrderStatus;
      tableId?: string;
      type?: OrderType;
      paymentMethod?: PaymentMethod;
      publicCode?: {
        contains: string;
        mode: "insensitive";
      };
    };

    const where: WhereClause = {
      branchId,
    };

    // Date range filter — dates come in as UTC midnight from date pickers;
    // use Argentina-aware boundaries (midnight AR = 03:00 UTC)
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const { start } = dateStringToTimestampBoundsAR(
          startDate.toISOString().slice(0, 10),
        );
        where.createdAt.gte = start;
      }
      if (endDate) {
        const { end } = dateStringToTimestampBoundsAR(
          endDate.toISOString().slice(0, 10),
        );
        where.createdAt.lt = end;
      }
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Table filter
    if (tableId) {
      where.tableId = tableId;
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Payment method filter
    if (paymentMethod) {
      where.paymentMethod = paymentMethod as PaymentMethod;
    }

    // Search filter (by public code)
    if (search) {
      where.publicCode = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Parallel reads — no transaction needed, each gets its own connection
    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          table: {
            select: {
              number: true,
              name: true,
              sectorId: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  categoryId: true,
                },
              },
            },
            orderBy: {
              id: "asc",
            },
          },
          client: {
            select: {
              id: true,
              branchId: true,
              name: true,
              phone: true,
              email: true,
              birthDate: true,
              taxId: true,
              notes: true,
              addressStreet: true,
              addressNumber: true,
              addressApartment: true,
              addressCity: true,
              discountPercentage: true,
              discountType: true,
              preferredPaymentMethod: true,
              hasCurrentAccount: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          invoices: {
            select: {
              id: true,
              status: true,
              // Removed: cae, invoiceNumber, invoiceDate - not needed in order list
              // Full invoice details loaded only when viewing specific order
            },
            // Removed orderBy - reduces query complexity, order list only needs existence/status
          },
          cashMovements: {
            where: { type: "SALE" },
            select: {
              paymentMethod: true,
              amount: true,
            },
          },
          canceledBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: sortOrder,
        },
        skip,
        take: pageSize,
      }),
    ]);

    // Serialize Decimal fields to numbers
    const serializedOrders = orders.map((order) => ({
      ...order,
      discountPercentage: Number(order.discountPercentage),
      deliveryFee: Number(order.deliveryFee),
      client: order.client ? serializeClient(order.client) : null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      })),
      invoices: order.invoices || [],
      cashMovements: order.cashMovements.map((m) => ({
        paymentMethod: m.paymentMethod,
        amount: Number(m.amount),
      })),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: serializedOrders,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error getting orders:", error);
    return {
      success: false,
      error: "Error al obtener las órdenes",
      data: [],
      pagination: {
        page: 1,
        pageSize: 15,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }
}

// Update payment method
export async function updatePaymentMethod(
  orderId: string,
  paymentMethod: PaymentMethod,
) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error updating payment method:", error);
    return {
      success: false,
      error: "Error al actualizar el método de pago",
    };
  }
}

// Update discount
export async function updateDiscount(
  orderId: string,
  discountPercentage: number,
  discountType: "PERCENTAGE" | "FIXED" = "PERCENTAGE",
) {
  try {
    // Authorization check - only MANAGER and above can apply discounts
    await authorizeAction(
      UserRole.MANAGER,
      "Solo gerentes y superiores pueden aplicar descuentos",
    );

    // Validate discount value
    if (
      discountType === "PERCENTAGE" &&
      (discountPercentage < 0 || discountPercentage > 100)
    ) {
      return {
        success: false,
        error: "El descuento porcentual debe estar entre 0 y 100",
      };
    }
    if (discountPercentage < 0) {
      return {
        success: false,
        error: "El descuento no puede ser negativo",
      };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { discountPercentage, discountType },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        discountType: String(order.discountType),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error updating discount:", error);
    return {
      success: false,
      error: "Error al actualizar el descuento",
    };
  }
}

// Update delivery fee for a delivery order
export async function updateDeliveryFee(orderId: string, fee: number) {
  try {
    if (fee < 0) {
      return {
        success: false,
        error: "El costo de envío no puede ser negativo",
      };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { deliveryFee: fee },
    });

    return {
      success: true,
      data: {
        ...order,
        deliveryFee: Number(order.deliveryFee),
        discountPercentage: Number(order.discountPercentage),
      },
    };
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    return {
      success: false,
      error: "Error al actualizar el costo de envío",
    };
  }
}

// Assign staff to order
export async function assignStaffToOrder(
  orderId: string,
  userId: string | null,
) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { assignedToId: userId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error assigning staff to order:", error);
    return {
      success: false,
      error: "Error al asignar personal a la orden",
    };
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    // Prevent manual status change to COMPLETED
    // COMPLETED status should only be set via closeTableWithPayment()
    if (status === OrderStatus.COMPLETED) {
      return {
        success: false,
        error:
          "No se puede marcar como completada manualmente. Use 'Finalizar Venta' para registrar el pago.",
      };
    }

    // Prevent reverting a COMPLETED order — doing so would allow re-closing it
    // with a different payment method, creating duplicate cash movements.
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (current?.status === OrderStatus.COMPLETED) {
      return {
        success: false,
        error: "No se puede modificar el estado de una orden ya completada.",
      };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Error al actualizar el estado de la orden",
    };
  }
}

// Cancel order with reason and audit info
export async function cancelOrder(orderId: string, reason: string) {
  try {
    if (!reason.trim()) {
      return { success: false, error: "El motivo de cancelación es obligatorio" };
    }

    const { userId } = await authorizeAction(UserRole.EMPLOYEE);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELED,
        canceledAt: new Date(),
        cancelReason: reason.trim(),
        canceledById: userId,
      },
      include: {
        canceledBy: {
          select: { name: true },
        },
      },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error canceling order:", error);
    return { success: false, error: "Error al cancelar la orden" };
  }
}

// Assign client to order
export async function assignClientToOrder(
  orderId: string,
  clientId: string | null,
) {
  try {
    // Get client discount if clientId is provided
    const clientDiscount = await getClientDiscount(clientId);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        clientId: clientId,
        discountPercentage: clientDiscount.discountPercentage,
        discountType: clientDiscount.discountType as "PERCENTAGE" | "FIXED",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error assigning client to order:", error);
    return {
      success: false,
      error: "Error al asignar cliente a la orden",
    };
  }
}

// Mark order as needing invoice
export async function setNeedsInvoice(orderId: string, needsInvoice: boolean) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { needsInvoice },
    });

    return {
      success: true,
      data: {
        ...order,
        discountPercentage: Number(order.discountPercentage),
        deliveryFee: Number(order.deliveryFee),
      },
    };
  } catch (error) {
    console.error("Error updating invoice flag:", error);
    return {
      success: false,
      error: "Error al actualizar la solicitud de factura",
    };
  }
}

// DEPRECATED: Old invoice functions have been replaced by ARCA-compliant invoice system
// See actions/Invoice.ts for the new implementation:
// - generateInvoiceForOrder() - Generates ARCA electronic invoices with CAE
// - getInvoices() - Lists invoices with pagination and filters
// - getInvoiceById() - Gets a single invoice with full details

// Close table with payment - records payment in cash register
export async function closeTableWithPayment(data: {
  orderId: string;
  payments: PaymentEntry[];
  sessionId: string;
  isPartialClose?: boolean;
}) {
  try {
    const { userId } = await authorizeAction(UserRole.MANAGER);
    const { orderId, payments, sessionId, isPartialClose } = data;

    const result = await prisma.$transaction(async (tx) => {
      // Get the order with items and table
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          table: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === OrderStatus.COMPLETED) {
        throw new Error("Order is already completed");
      }

      if (order.items.length === 0) {
        throw new Error("Cannot close an order without items");
      }

      // Validate session exists and is open
      const session = await tx.cashRegisterSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error("Cash register session not found");
      }

      if (session.status === "CLOSED") {
        throw new Error("Cannot add movements to a closed session");
      }

      // Calculate order total
      const subtotal = order.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
      const discountAmount = calculateDiscountAmount(
        subtotal,
        Number(order.discountPercentage),
        String(order.discountType) as "PERCENTAGE" | "FIXED",
      );
      const deliveryFeeAmount = Number(order.deliveryFee);
      const total = subtotal - discountAmount + deliveryFeeAmount;

      // Validate payments array - allow empty if total is $0
      if ((!payments || payments.length === 0) && total > 0.01) {
        throw new Error("At least one payment method is required");
      }

      // Validate payment amounts match total
      const totalPayment = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Reject only if payment is less than total (allow overpayment / change)
      if (totalPayment < total - 0.01) {
        throw new Error(
          `El pago ($${totalPayment.toFixed(
            2,
          )}) es menor al total de la orden ($${total.toFixed(2)})`,
        );
      }

      // Create cash movements for each payment
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          await tx.cashMovement.create({
            data: {
              sessionId,
              type: "SALE",
              paymentMethod: payment.method,
              amount: payment.amount,
              description: `Mesa ${order.table?.number || "S/N"} - Orden ${
                order.publicCode
              }`,
              orderId: order.id,
              createdBy: userId,
            },
          });
        }
      }

      // Determine primary payment method for the order
      // Use the method with the highest amount, or default to CASH if no payments
      const primaryPayment =
        payments && payments.length > 0
          ? payments.reduce((max, p) => (p.amount > max.amount ? p : max))
          : { method: "CASH" as const, amount: 0 };

      // Map extended payment method to Order's PaymentMethod enum
      let orderPaymentMethod: PaymentMethod;
      switch (primaryPayment.method) {
        case "CASH":
          orderPaymentMethod = PaymentMethod.CASH;
          break;
        case "CARD_DEBIT":
        case "CARD_CREDIT":
          orderPaymentMethod = PaymentMethod.CARD;
          break;
        case "TRANSFER":
        case "ACCOUNT":
          orderPaymentMethod = PaymentMethod.TRANSFER;
          break;
        case "PAYMENT_LINK":
          orderPaymentMethod = PaymentMethod.PAYMENT_LINK;
          break;
        case "QR_CODE":
          orderPaymentMethod = PaymentMethod.QR_CODE;
          break;
        default:
          orderPaymentMethod = PaymentMethod.CASH;
      }

      const previousTableId = order.tableId;

      // Update order status and payment method
      const completedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: isPartialClose
            ? OrderStatus.IN_PROGRESS
            : OrderStatus.COMPLETED,
          paymentMethod: orderPaymentMethod,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          table: true,
        },
      });

      // If not partial close, check if table should be cleared
      if (!isPartialClose && previousTableId) {
        const activeOrders = await tx.order.count({
          where: {
            tableId: previousTableId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
        });

        // If no more active orders, clear table status
        if (activeOrders === 0) {
          await tx.table.update({
            where: { id: previousTableId },
            data: { status: "EMPTY" },
          });
        }
      }

      return completedOrder;
    });

    // Serialize for client
    const serializedOrder = {
      ...result,
      discountPercentage: Number(result.discountPercentage),
      deliveryFee: Number(result.deliveryFee),
      items: result.items.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        product: serializeProduct(item.product),
      })),
    };

    return {
      success: true,
      data: serializedOrder,
    };
  } catch (error) {
    console.error("Error closing table with payment:", error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Error closing the table",
    };
  }
}

// ============================================================================
// Invoice-related Order Queries
// ============================================================================

/**
 * Order without invoice (for invoice creation)
 */

import type { ActionResult } from "@/types/action-result";

/**
 * Get completed orders without emitted invoices
 * Used for invoice creation dialog
 */
export async function getOrdersWithoutInvoice(params: {
  branchId: string;
  search?: string;
  limit?: number;
}): Promise<ActionResult<OrderWithoutInvoice[]>> {
  try {
    const { branchId, search, limit = 20 } = params;

    // Build where clause conditionally
    const whereClause: {
      branchId: string;
      status: OrderStatus;
      invoices: { none: { status: InvoiceStatus } };
      OR?: Array<{
        publicCode?: { contains: string; mode: "insensitive" };
        customerName?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      branchId,
      status: OrderStatus.COMPLETED,
      invoices: {
        none: {
          status: InvoiceStatus.EMITTED,
        },
      },
    };

    // Only add OR clause if search is provided
    if (search && search.trim()) {
      whereClause.OR = [
        { publicCode: { contains: search.trim(), mode: "insensitive" } },
        { customerName: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          select: { quantity: true, price: true },
        },
        table: {
          select: { name: true, number: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate totals and serialize
    const ordersWithTotal: OrderWithoutInvoice[] = orders.map((order) => ({
      id: order.id,
      publicCode: order.publicCode,
      customerName: order.customerName,
      table: order.table,
      type: order.type,
      total: order.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ),
    }));

    return {
      success: true,
      data: ordersWithTotal,
    };
  } catch (error) {
    console.error("Error getting orders without invoice:", error);
    return {
      success: false,
      error: "Error al obtener pedidos sin factura",
    };
  }
}

// ============================================================================
// Active Order Counts (for tab badges)
// ============================================================================

/**
 * Get count of active orders by type
 * Used for displaying badges on order type tabs
 */
// Change order type between TAKE_AWAY and DELIVERY
// Recalculates item prices and adjusts delivery fee accordingly
export async function updateOrderType(
  orderId: string,
  newType: OrderType,
): Promise<{ success: boolean; error?: string }> {
  try {
    await authorizeAction(
      UserRole.MANAGER,
      "Solo gerentes y superiores pueden cambiar el tipo de orden",
    );

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        branchId: true,
        type: true,
        status: true,
        items: {
          select: { id: true, productId: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }
    if (order.status === OrderStatus.CANCELED) {
      return {
        success: false,
        error: "No se puede cambiar el tipo de una orden cancelada",
      };
    }
    if (order.type === newType) {
      return { success: false, error: "La orden ya es de ese tipo" };
    }
    if (order.type === OrderType.DINE_IN || newType === OrderType.DINE_IN) {
      return {
        success: false,
        error: "Solo se puede cambiar entre Para Llevar y Delivery",
      };
    }

    // Build price map for items that have a productId
    const productIds = order.items
      .filter((item) => item.productId)
      .map((item) => item.productId!);

    const priceMap: Record<string, number> = {};

    if (productIds.length > 0) {
      const pobs = await prisma.productOnBranch.findMany({
        where: {
          branchId: order.branchId,
          productId: { in: productIds },
        },
        select: {
          productId: true,
          prices: {
            where: {
              type: {
                in: [newType, OrderType.DINE_IN] as never[],
              },
            },
            select: { price: true, type: true },
          },
        },
      });

      for (const pob of pobs) {
        // Prefer the new type price, fall back to DINE_IN
        const priceObj =
          pob.prices.find((p) => p.type === (newType as string)) ??
          pob.prices.find((p) => p.type === OrderType.DINE_IN);
        if (priceObj) {
          priceMap[pob.productId] = Number(priceObj.price);
        }
      }
    }

    // Auto-apply delivery fee from config when switching TO delivery
    let newDeliveryFee = 0;
    if (newType === OrderType.DELIVERY) {
      const config = await prisma.deliveryConfig.findUnique({
        where: { branchId: order.branchId },
        select: { deliveryFee: true },
      });
      newDeliveryFee = Number(config?.deliveryFee ?? 0);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { type: newType, deliveryFee: newDeliveryFee },
      });

      for (const item of order.items) {
        if (item.productId && priceMap[item.productId] !== undefined) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { price: priceMap[item.productId] },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating order type:", error);
    return { success: false, error: "Error al cambiar el tipo de orden" };
  }
}

export async function getActiveOrderCounts(branchId: string) {
  try {
    return await unstable_cache(
      async () => {
        const counts = await prisma.order.groupBy({
          by: ["type"],
          where: {
            branchId,
            status: {
              in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
            },
          },
          _count: {
            id: true,
          },
        });

        return {
          DINE_IN:
            counts.find((c) => c.type === OrderType.DINE_IN)?._count.id ?? 0,
          TAKE_AWAY:
            counts.find((c) => c.type === OrderType.TAKE_AWAY)?._count.id ?? 0,
          DELIVERY:
            counts.find((c) => c.type === OrderType.DELIVERY)?._count.id ?? 0,
        };
      },
      [`active-order-counts-${branchId}`],
      { revalidate: 30 }
    )();
  } catch (error) {
    console.error("Error getting active order counts:", error);
    return {
      DINE_IN: 0,
      TAKE_AWAY: 0,
      DELIVERY: 0,
    };
  }
}

// Create a completed counter sale (Venta por Mostrador) in one step.
// Orders are type=COUNTER, status=COMPLETED with the chosen payment method.
export async function createCounterSaleOrder(data: {
  branchId: string;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  description?: string | null;
  sessionId?: string;
}) {
  try {
    const { userId } = await authorizeAction(UserRole.WAITER);
    const { branchId, items, paymentMethod, description, sessionId } = data;

    if (!items || items.length === 0) {
      return { success: false, error: "Se requiere al menos un producto" };
    }

    const publicCode = `C${Date.now().toString().slice(-8)}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          branchId,
          type: OrderType.COUNTER,
          publicCode,
          status: OrderStatus.COMPLETED,
          paymentMethod,
          discountPercentage: 0,
          discountType: "PERCENTAGE",
          deliveryFee: 0,
          description: description || null,
        },
      });

      const hasModifiers = items.some(
        (item) => item.modifiers && item.modifiers.length > 0,
      );

      if (hasModifiers) {
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              itemName: item.itemName,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice,
              notes: item.notes || null,
              ...(item.modifiers && item.modifiers.length > 0
                ? {
                    modifiers: {
                      create: item.modifiers.map((mod) => ({
                        modifierOptionId: mod.modifierOptionId,
                        optionName: mod.optionName,
                        groupName: mod.groupName,
                        priceAdjustment: mod.priceAdjustment,
                        quantity: mod.quantity ?? 1,
                      })),
                    },
                  }
                : {}),
            },
          });
        }
      } else {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: newOrder.id,
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            notes: item.notes || null,
          })),
        });
      }

      await _deductIngredientStockBatch(
        tx,
        branchId,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers ?? [],
        }))
      );

      // Auto-decrement combo component stocks
      await _deductComboComponentStock(
        tx,
        branchId,
        items
          .filter(
            (item): item is typeof item & { productId: string } =>
              !!item.productId
          )
          .map((item) => ({
            productId: item.productId,
            itemName: item.itemName,
            quantity: item.quantity,
          }))
      );

      // Record cash movement if an open session is provided
      if (sessionId) {
        const session = await tx.cashRegisterSession.findFirst({
          where: {
            id: sessionId,
            status: "OPEN",
            cashRegister: { branchId },
          },
        });

        if (session) {
          const totalAmount = items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0,
          );
          const pmExtended =
            paymentMethod === PaymentMethod.CARD
              ? ("CARD_DEBIT" as PaymentMethodExtended)
              : (paymentMethod as unknown as PaymentMethodExtended);

          await tx.cashMovement.create({
            data: {
              sessionId,
              branchId,
              type: "SALE",
              paymentMethod: pmExtended,
              amount: totalAmount,
              description: `Mostrador - ${publicCode}`,
              orderId: newOrder.id,
              createdBy: userId,
            },
          });
        }
      }

      const completeOrder = await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: { product: true, modifiers: true },
            orderBy: { id: "asc" },
          },
        },
      });

      return completeOrder;
    });

    if (!order) {
      return { success: false, error: "Error al crear la venta" };
    }

    if (sessionId) {
      revalidatePath("/dashboard/cash-registers");
    }

    return { success: true, data: serializeForClient(order) };
  } catch (error) {
    console.error("Error creating counter sale:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al crear la venta",
    };
  }
}

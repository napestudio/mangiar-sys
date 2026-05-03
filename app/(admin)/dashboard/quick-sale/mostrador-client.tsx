"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PaymentMethod } from "@/app/generated/prisma";
import { createCounterSaleOrder } from "@/actions/Order";
import { convertLinkQuantityToBase } from "@/lib/unit-conversions";
import { ModifierSelectionDialog } from "@/components/dashboard/modifier-selection-dialog";
import { useToast } from "@/hooks/use-toast";
import { CategorySelector } from "./category-selector";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import type { OrderProduct } from "@/types/products";
import type { CartItem } from "@/types/mostrador";
import type { PreOrderItem } from "@/components/dashboard/pre-order-items-list";

type OpenRegister = {
  id: string;
  name: string;
  sectors: { id: string; name: string; color: string | null }[];
  session: { id: string; openedAt: string; openingAmount: number } | null;
};

interface MostradorClientProps {
  branchId: string;
  initialProducts: OrderProduct[];
  openRegisters: OpenRegister[];
}

export function MostradorClient({
  branchId,
  initialProducts,
  openRegisters,
}: MostradorClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingProduct, setPendingProduct] = useState<OrderProduct | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const firstSession = openRegisters.find((r) => r.session)?.session ?? null;
    setSelectedSessionId(firstSession?.id ?? null);
  }, [openRegisters]);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of initialProducts) {
      if (p.categoryId && p.category) {
        seen.set(p.categoryId, p.category.name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [initialProducts]);

  const filteredProducts = useMemo(
    () =>
      selectedCategoryId
        ? initialProducts.filter((p) => p.categoryId === selectedCategoryId)
        : initialProducts,
    [initialProducts, selectedCategoryId],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const consumedIngredients = useMemo(() => {
    const consumed: Record<string, number> = {};
    for (const item of cart) {
      for (const mod of item.modifiers ?? []) {
        for (const product of initialProducts) {
          for (const group of product.modifierGroups ?? []) {
            const option = group.options.find(
              (o) => o.id === mod.modifierOptionId,
            );
            if (!option) continue;
            for (const link of option.ingredientLinks) {
              const perUnit = convertLinkQuantityToBase(
                link.quantity,
                link.ingredientUnitType,
                link.weightUnit,
                link.volumeUnit,
                link.ingredientWeightUnit,
                link.ingredientVolumeUnit,
              );
              const total = perUnit * (mod.quantity ?? 1) * item.quantity;
              consumed[link.ingredientId] =
                (consumed[link.ingredientId] ?? 0) + total;
            }
          }
        }
      }
    }
    return consumed;
  }, [cart, initialProducts]);

  function handleProductTap(product: OrderProduct) {
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setPendingProduct(product);
    } else {
      addSimpleProductToCart(product);
    }
  }

  function addSimpleProductToCart(product: OrderProduct) {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && !item.modifiers?.length,
      );
      if (existing) {
        return prev.map((item) =>
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      const newItem: CartItem = {
        cartId: crypto.randomUUID(),
        productId: product.id,
        itemName: product.name,
        quantity: 1,
        price: product.price,
        originalPrice: product.price,
        categoryId: product.categoryId,
      };
      return [...prev, newItem];
    });
  }

  function handleModifierConfirm(item: PreOrderItem) {
    const newItem: CartItem = {
      ...item,
      cartId: crypto.randomUUID(),
    };
    setCart((prev) => [...prev, newItem]);
    setPendingProduct(null);
  }

  function handleUpdateCartItem(cartId: string, updated: CartItem) {
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? updated : item)),
    );
  }

  function handleRemoveCartItem(cartId: string) {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  async function handleConfirmOrder() {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createCounterSaleOrder({
        branchId,
        paymentMethod,
        sessionId: selectedSessionId ?? undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          notes: item.notes,
          modifiers: item.modifiers,
        })),
      });

      if (!result.success) {
        toast({
          title: "Error al confirmar",
          description: result.error ?? "No se pudo crear la venta",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Venta confirmada",
        description: `Venta por mostrador registrada correctamente`,
      });

      setCart([]);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mostrador</h1>
          <p className="text-sm text-gray-500">Venta por mostrador</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-4">
          <CategorySelector
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <div className="flex-1 min-h-0 lg:overflow-y-auto pr-2 pt-1">
            <ProductGrid
              products={filteredProducts}
              onProductTap={handleProductTap}
            />
          </div>
        </div>

        <div className="lg:w-96 lg:shrink-0">
          <CartPanel
            cart={cart}
            total={cartTotal}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveCartItem}
            onConfirmOrder={handleConfirmOrder}
            isSubmitting={isSubmitting}
            openRegisters={openRegisters}
            selectedSessionId={selectedSessionId}
            onSessionChange={setSelectedSessionId}
          />
        </div>
      </div>

      {pendingProduct && (
        <ModifierSelectionDialog
          product={pendingProduct}
          open={!!pendingProduct}
          onConfirm={handleModifierConfirm}
          onCancel={() => setPendingProduct(null)}
          consumedIngredients={consumedIngredients}
        />
      )}
    </div>
  );
}

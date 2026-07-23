"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { OrderProduct } from "@/types/products";

interface ProductGridProps {
  products: OrderProduct[];
  onProductTap: (product: OrderProduct) => void;
}

export function ProductGrid({ products, onProductTap }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <Package className="h-12 w-12" />
        <p className="text-sm">No hay productos disponibles</p>
      </div>
    );
  }

  const sorted = [...products].sort((a, b) => {
    const aOut = a.isCombo
      ? (a.comboAvailability ?? 0) <= 0
      : a.trackStock && a.stock <= 0;
    const bOut = b.isCombo
      ? (b.comboAvailability ?? 0) <= 0
      : b.trackStock && b.stock <= 0;
    return Number(aOut) - Number(bOut);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-1">
      {sorted.map((product) => {
        const outOfStock = product.isCombo
          ? (product.comboAvailability ?? 0) <= 0
          : product.trackStock && product.stock <= 0;

        return (
          <button
            key={product.id}
            onClick={() => !outOfStock && onProductTap(product)}
            disabled={outOfStock}
            className={cn(
              "flex items-start rounded-xl border bg-white shadow-sm p-3 gap-2",
              "text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-red-600",
              outOfStock
                ? "opacity-40 cursor-not-allowed"
                : "hover:shadow-md hover:border-gray-400 cursor-pointer active:scale-95",
            )}
          >
            {product.imageUrl ? (
              <div className="relative w-22 aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full"
                  width={200}
                  height={200}
                />
              </div>
            ) : (
              <div className="w-22 aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
            )}
            <div className="w-2/3 py-1">
              <p className="text-sm font-semibold leading-tight line-clamp-2">
                {product.name}
              </p>

              <p className="text-base font-bold text-gray-900 mt-auto">
                {formatCurrency(product.price)}
              </p>

              {(product.modifierGroups?.length ?? 0) > 0 && (
                <span className="text-xs text-gray-400">Con opciones</span>
              )}
            </div>

            {outOfStock && (
              <span className="text-xs text-red-500 font-medium">
                Sin stock
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

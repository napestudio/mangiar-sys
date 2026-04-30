"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { convertLinkQuantityToBase } from "@/lib/unit-conversions";
import type { OrderProduct } from "@/types/products";
import type { ModifierOptionData, ResolvedModifierGroup } from "@/types/modifiers";
import type { SelectedModifier } from "@/types/orders";
import type { PreOrderItem } from "./pre-order-items-list";

interface ModifierSelectionDialogProps {
  product: OrderProduct;
  open: boolean;
  onConfirm: (item: PreOrderItem) => void;
  onCancel: () => void;
  consumedIngredients?: Record<string, number>;
}

function isOptionDisabled(option: { isAvailable: boolean; isOutOfStock: boolean }): boolean {
  return !option.isAvailable || option.isOutOfStock;
}

function getOptionMaxQuantity(
  option: ModifierOptionData,
  consumed: Record<string, number>,
): number {
  if (option.ingredientLinks.length === 0) return Infinity;
  return Math.min(
    ...option.ingredientLinks.map((link) => {
      const requiredInBase = convertLinkQuantityToBase(
        link.quantity,
        link.ingredientUnitType,
        link.weightUnit,
        link.volumeUnit,
        link.ingredientWeightUnit,
        link.ingredientVolumeUnit,
      );
      if (requiredInBase <= 0) return Infinity;
      const remaining = Math.max(0, link.stock - (consumed[link.ingredientId] ?? 0));
      return Math.floor(remaining / requiredInBase);
    }),
  );
}

function buildDefaultSelections(groups: ResolvedModifierGroup[]): Record<string, string[]> {
  const initial: Record<string, string[]> = {};
  for (const group of groups) {
    const defaults = group.options
      .filter((o) => o.isDefault && !isOptionDisabled(o))
      .map((o) => o.id);
    initial[group.id] = defaults;
  }
  return initial;
}

export function ModifierSelectionDialog({
  product,
  open,
  onConfirm,
  onCancel,
  consumedIngredients = {},
}: ModifierSelectionDialogProps) {
  const groups: ResolvedModifierGroup[] = product.modifierGroups ?? [];

  // Map from groupId → selected option IDs
  const [selections, setSelections] = useState<Record<string, string[]>>(
    () => buildDefaultSelections(groups),
  );

  // Map from optionId → quantity (defaults to 1 via ?? 1)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleRadioSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: [optionId] }));
  };

  const handleCheckboxToggle = (
    group: ResolvedModifierGroup,
    optionId: string,
  ) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= group.effectiveMax) {
        // Replace last selection when max is reached
        return { ...prev, [group.id]: [...current.slice(1), optionId] };
      }
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const handleQuantityChange = (
    option: ModifierOptionData,
    delta: number,
  ) => {
    const maxQty = getOptionMaxQuantity(option, consumedIngredients);
    setQuantities((prev) => {
      const current = prev[option.id] ?? 1;
      const next = current + delta;
      if (next < 1) return prev;
      if (next > maxQty) return prev;
      return { ...prev, [option.id]: next };
    });
  };

  // Compute running total — modifier price × modifier quantity
  const basePrice = Number(product.price);
  const modifierTotal = groups.reduce((sum, group) => {
    const selected = selections[group.id] ?? [];
    const groupSum = group.options
      .filter((o) => selected.includes(o.id))
      .reduce(
        (s, o) => s + o.priceAdjustment * (quantities[o.id] ?? 1),
        0,
      );
    return sum + groupSum;
  }, 0);
  const finalPrice = basePrice + modifierTotal;

  // Validation: required groups need ≥ effectiveMin selections
  const validationErrors: string[] = [];
  for (const group of groups) {
    if (!group.effectiveRequired) continue;
    const count = (selections[group.id] ?? []).length;
    if (count < group.effectiveMin) {
      validationErrors.push(
        `"${group.name}" requiere al menos ${group.effectiveMin} opción${group.effectiveMin !== 1 ? "es" : ""}`,
      );
    }
  }

  const handleConfirm = () => {
    if (validationErrors.length > 0) return;

    const modifiers: SelectedModifier[] = [];
    for (const group of groups) {
      const selected = selections[group.id] ?? [];
      for (const optionId of selected) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          modifiers.push({
            modifierOptionId: option.id,
            optionName: option.name,
            groupName: group.name,
            priceAdjustment: option.priceAdjustment,
            quantity: quantities[option.id] ?? 1,
          });
        }
      }
    }

    onConfirm({
      productId: product.id,
      itemName: product.name,
      quantity: 1,
      price: finalPrice,
      originalPrice: basePrice,
      categoryId: product.categoryId,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
    });

    resetState();
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const resetState = () => {
    setSelections(buildDefaultSelections(groups));
    setQuantities({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {groups.map((group) => {
            const isRadio = group.effectiveMax === 1;
            const selected = selections[group.id] ?? [];

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-gray-500">{group.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.effectiveRequired ? "Requerido" : "Opcional"}
                    {group.effectiveMax > 1 &&
                      ` · hasta ${group.effectiveMax}`}
                  </span>
                </div>

                <div className="space-y-1 pl-1">
                  {group.options.map((option) => {
                    const isChecked = selected.includes(option.id);
                    const maxQty = getOptionMaxQuantity(option, consumedIngredients);
                    const disabled = isOptionDisabled(option) || maxQty <= 0;
                    const qty = quantities[option.id] ?? 1;
                    const effectiveQty = isChecked ? qty : 1;
                    const priceLabel =
                      option.priceAdjustment !== 0
                        ? ` ${option.priceAdjustment > 0 ? "+" : ""}${formatCurrency(option.priceAdjustment * effectiveQty)}`
                        : "";

                    const disabledLabel = !option.isAvailable
                      ? "No disponible"
                      : option.isOutOfStock || maxQty <= 0
                        ? "Sin stock"
                        : null;

                    if (isRadio) {
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
                        >
                          <input
                            type="radio"
                            name={`group-${group.id}`}
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() =>
                              handleRadioSelect(group.id, option.id)
                            }
                            className="accent-primary"
                          />
                          <span className="flex-1">{option.name}</span>
                          {disabledLabel && (
                            <span className="text-xs text-gray-400 italic">
                              {disabledLabel}
                            </span>
                          )}
                          {isChecked && !disabled && (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() =>
                                  handleQuantityChange(option, -1)
                                }
                                disabled={qty <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-4 text-center text-xs font-medium">
                                {qty}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() =>
                                  handleQuantityChange(option, 1)
                                }
                                disabled={qty >= maxQty}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {priceLabel && (
                            <span className="text-xs text-gray-500 min-w-12 text-right">
                              {priceLabel}
                            </span>
                          )}
                        </label>
                      );
                    }

                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={disabled}
                          onCheckedChange={() =>
                            handleCheckboxToggle(group, option.id)
                          }
                        />
                        <span className="flex-1">{option.name}</span>
                        {disabledLabel && (
                          <span className="text-xs text-gray-400 italic">
                            {disabledLabel}
                          </span>
                        )}
                        {isChecked && !disabled && (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleQuantityChange(option, -1)
                              }
                              disabled={qty <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center text-xs font-medium">
                              {qty}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleQuantityChange(option, 1)
                              }
                              disabled={qty >= maxQty}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {priceLabel && (
                          <span className="text-xs text-gray-500 min-w-12 text-right">
                            {priceLabel}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {validationErrors.length > 0 && (
          <p className="text-xs text-red-500 -mt-1">
            {validationErrors[0]}
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex justify-between items-center text-sm font-semibold w-full">
            <span>Total:</span>
            <span>{formatCurrency(finalPrice)}</span>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={validationErrors.length > 0}
            >
              Agregar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

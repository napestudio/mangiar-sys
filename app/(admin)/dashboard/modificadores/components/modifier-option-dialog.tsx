"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  createModifierOption,
  updateModifierOption,
} from "@/actions/ModifierGroups";
import {
  WEIGHT_UNIT_OPTIONS,
  VOLUME_UNIT_OPTIONS,
  getWeightUnitShortLabel,
  getVolumeUnitShortLabel,
} from "@/app/(admin)/dashboard/menu-items/lib/units";
import type { IngredientWithStats } from "@/types/ingredients";
import type { ModifierOptionData } from "@/types/modifiers";
import type { WeightUnit, VolumeUnit } from "@/app/generated/prisma";
import { UnitType } from "@/app/generated/prisma";

type Props = {
  option: ModifierOptionData | null;
  groupId: string;
  availableIngredients: IngredientWithStats[];
  onClose: () => void;
  onSuccess: (saved: ModifierOptionData, isNew: boolean) => void;
};

type IngredientLink = {
  ingredientId: string;
  quantity: string;
  weightUnit: string; // selected unit (WeightUnit value or "")
  volumeUnit: string; // selected unit (VolumeUnit value or "")
};

function getIngredient(ingredients: IngredientWithStats[], id: string) {
  return ingredients.find((i) => i.id === id) ?? null;
}

function defaultUnitsForIngredient(ing: IngredientWithStats | null): {
  weightUnit: string;
  volumeUnit: string;
} {
  return {
    weightUnit: ing?.unitType === UnitType.WEIGHT ? (ing.weightUnit ?? "") : "",
    volumeUnit: ing?.unitType === UnitType.VOLUME ? (ing.volumeUnit ?? "") : "",
  };
}

export default function ModifierOptionDialog({
  option,
  groupId,
  availableIngredients,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState(option?.name ?? "");
  const [priceAdjustment, setPriceAdjustment] = useState(
    String(option?.priceAdjustment ?? 0),
  );
  const [isDefault, setIsDefault] = useState(option?.isDefault ?? false);
  const [isAvailable, setIsAvailable] = useState(option?.isAvailable ?? true);
  const [ingredientLinks, setIngredientLinks] = useState<IngredientLink[]>(
    option?.ingredientLinks?.map((l) => ({
      ingredientId: l.ingredientId,
      quantity: String(l.quantity),
      weightUnit: l.weightUnit ?? l.ingredientWeightUnit ?? "",
      volumeUnit: l.volumeUnit ?? l.ingredientVolumeUnit ?? "",
    })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const selectClass =
    "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500";

  const addIngredientLink = () => {
    setIngredientLinks((prev) => [
      ...prev,
      { ingredientId: "", quantity: "1", weightUnit: "", volumeUnit: "" },
    ]);
  };

  const removeIngredientLink = (index: number) => {
    setIngredientLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredientLink = (
    index: number,
    field: keyof IngredientLink,
    value: string,
  ) => {
    setIngredientLinks((prev) =>
      prev.map((link, i) => {
        if (i !== index) return link;
        // When ingredient changes, reset units to its base unit
        if (field === "ingredientId") {
          const ing = getIngredient(availableIngredients, value);
          return {
            ...link,
            ingredientId: value,
            ...defaultUnitsForIngredient(ing),
          };
        }
        return { ...link, [field]: value };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const price = parseFloat(priceAdjustment);
    if (isNaN(price)) {
      setError("El ajuste de precio debe ser un número válido");
      return;
    }
    for (const link of ingredientLinks) {
      if (!link.ingredientId) {
        setError("Seleccioná un ingrediente para cada fila");
        return;
      }
      if (isNaN(parseFloat(link.quantity)) || parseFloat(link.quantity) <= 0) {
        setError("La cantidad del ingrediente debe ser mayor a 0");
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        priceAdjustment: price,
        isDefault,
        isAvailable,
        ingredientLinks: ingredientLinks.map((l) => ({
          ingredientId: l.ingredientId,
          quantity: parseFloat(l.quantity),
          weightUnit: (l.weightUnit || undefined) as WeightUnit | undefined,
          volumeUnit: (l.volumeUnit || undefined) as VolumeUnit | undefined,
        })),
      };

      const result = option
        ? await updateModifierOption({ id: option.id, ...payload })
        : await createModifierOption({ groupId, ...payload });

      if (result.success && result.data) {
        onSuccess(result.data, !option);
        onClose();
      } else if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {option ? "Editar opción" : "Nueva opción"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Chocolate, Pollo, Extra queso"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Ajuste de precio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  className={`${inputClass} pl-7`}
                  type="number"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(e.target.value)}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Positivo suma al precio base, negativo resta, 0 sin cambio.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Opción por defecto
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Disponible
              </label>
            </div>

            {/* Ingredient links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Ingredientes consumidos
                </label>
                <button
                  type="button"
                  onClick={addIngredientLink}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Opcional: indicá qué ingredientes se consumen al elegir esta
                opción. Podés usar la unidad que quieras (ej: 100 g aunque el
                ingrediente esté en kg).
              </p>

              {ingredientLinks.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Sin ingredientes vinculados
                </p>
              )}

              {ingredientLinks.map((link, idx) => {
                const ing = getIngredient(
                  availableIngredients,
                  link.ingredientId,
                );
                const isWeight = ing?.unitType === UnitType.WEIGHT;
                const isVolume = ing?.unitType === UnitType.VOLUME;

                const unitLabel = isWeight
                  ? getWeightUnitShortLabel(
                      link.weightUnit as WeightUnit | null,
                    )
                  : isVolume
                    ? getVolumeUnitShortLabel(
                        link.volumeUnit as VolumeUnit | null,
                      )
                    : "u";

                return (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    {/* Ingredient selector */}
                    <select
                      className={`flex-1 ${selectClass}`}
                      value={link.ingredientId}
                      onChange={(e) =>
                        updateIngredientLink(
                          idx,
                          "ingredientId",
                          e.target.value,
                        )
                      }
                      required
                    >
                      <option value="">Seleccioná ingrediente</option>
                      {availableIngredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      className={`w-20 ${selectClass}`}
                      value={link.quantity}
                      onChange={(e) =>
                        updateIngredientLink(idx, "quantity", e.target.value)
                      }
                      min="0.001"
                      step="0.001"
                      placeholder="Cant."
                      required
                    />

                    {/* Unit selector — only for WEIGHT / VOLUME */}
                    {isWeight && (
                      <select
                        className={`w-24 ${selectClass}`}
                        value={link.weightUnit}
                        onChange={(e) =>
                          updateIngredientLink(
                            idx,
                            "weightUnit",
                            e.target.value,
                          )
                        }
                      >
                        {WEIGHT_UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {isVolume && (
                      <select
                        className={`w-28 ${selectClass}`}
                        value={link.volumeUnit}
                        onChange={(e) =>
                          updateIngredientLink(
                            idx,
                            "volumeUnit",
                            e.target.value,
                          )
                        }
                      >
                        {VOLUME_UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {!isWeight && !isVolume && link.ingredientId && (
                      <span className="flex items-center px-2 py-2 text-sm text-gray-500">
                        {unitLabel}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeIngredientLink(idx)}
                      className="text-gray-400 hover:text-red-600 p-1 pt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-neutral-50 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {option ? "Actualizar" : "Crear"} opción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

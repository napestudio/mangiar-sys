"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { UnitType, WeightUnit, VolumeUnit } from "@/app/generated/prisma";
import { createIngredient, updateIngredient } from "@/actions/Ingredients";
import type { IngredientWithStats } from "@/types/ingredients";
import { WEIGHT_UNIT_OPTIONS, VOLUME_UNIT_OPTIONS } from "@/app/(admin)/dashboard/menu-items/lib/units";

type Props = {
  ingredient: IngredientWithStats | null;
  restaurantId: string;
  branchId: string;
  onClose: () => void;
  onSuccess: (saved: IngredientWithStats, isNew: boolean) => void;
};

type FormData = {
  name: string;
  description: string;
  unitType: UnitType;
  weightUnit: WeightUnit | "";
  volumeUnit: VolumeUnit | "";
  costPerUnit: string;
};

export default function IngredientDialog({
  ingredient,
  restaurantId,
  branchId,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: ingredient?.name ?? "",
    description: ingredient?.description ?? "",
    unitType: ingredient?.unitType ?? UnitType.UNIT,
    weightUnit: ingredient?.weightUnit ?? "",
    volumeUnit: ingredient?.volumeUnit ?? "",
    costPerUnit: ingredient?.costPerUnit?.toString() ?? "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const costVal = parseFloat(formData.costPerUnit);
    if (isNaN(costVal) || costVal < 0) {
      setError("El costo por unidad debe ser un número positivo");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const basePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        unitType: formData.unitType,
        weightUnit:
          formData.unitType === UnitType.WEIGHT && formData.weightUnit
            ? (formData.weightUnit as WeightUnit)
            : undefined,
        volumeUnit:
          formData.unitType === UnitType.VOLUME && formData.volumeUnit
            ? (formData.volumeUnit as VolumeUnit)
            : undefined,
        costPerUnit: costVal,
      };

      const result = ingredient
        ? await updateIngredient({ id: ingredient.id, ...basePayload })
        : await createIngredient({ ...basePayload, restaurantId });

      if (result.success && result.data) {
        onSuccess(result.data, !ingredient);
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

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {ingredient ? "Editar ingrediente" : "Nuevo ingrediente"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                className={inputClass}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Harina de trigo"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                className={inputClass}
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Descripción opcional"
              />
            </div>

            <div>
              <label className={labelClass}>Tipo de unidad *</label>
              <select
                className={inputClass}
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
              >
                <option value={UnitType.UNIT}>Unidad</option>
                <option value={UnitType.WEIGHT}>Peso</option>
                <option value={UnitType.VOLUME}>Volumen</option>
              </select>
            </div>

            {formData.unitType === UnitType.WEIGHT && (
              <div>
                <label className={labelClass}>Unidad de peso *</label>
                <select
                  className={inputClass}
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccioná una unidad</option>
                  {WEIGHT_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.unitType === UnitType.VOLUME && (
              <div>
                <label className={labelClass}>Unidad de volumen *</label>
                <select
                  className={inputClass}
                  name="volumeUnit"
                  value={formData.volumeUnit}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccioná una unidad</option>
                  {VOLUME_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Costo por unidad *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  className={`${inputClass} pl-7`}
                  type="number"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleChange}
                  step="0.0001"
                  min="0"
                  placeholder="0.0000"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Costo por unidad base (ej: por gramo, por ml, por unidad)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
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
              {ingredient ? "Actualizar" : "Crear"} ingrediente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

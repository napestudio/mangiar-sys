"use client";

import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import {
  createModifierGroup,
  updateModifierGroup,
} from "@/actions/ModifierGroups";
import type { ModifierGroupWithOptions } from "@/types/modifiers";

type Props = {
  group: ModifierGroupWithOptions | null;
  restaurantId: string;
  onClose: () => void;
  onSuccess: (saved: ModifierGroupWithOptions, isNew: boolean) => void;
};

type FormData = {
  name: string;
  description: string;
  required: boolean;
  minSelections: string;
  maxSelections: string;
};

export default function ModifierGroupDialog({
  group,
  restaurantId,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: group?.name ?? "",
    description: group?.description ?? "",
    required: group?.required ?? false,
    minSelections: String(group?.minSelections ?? 0),
    maxSelections: String(group?.maxSelections ?? 1),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const min = parseInt(formData.minSelections);
    const max = parseInt(formData.maxSelections);
    if (isNaN(min) || isNaN(max) || min < 0 || max < 1) {
      setError("Las selecciones mínima/máxima deben ser números válidos");
      return;
    }
    if (min > max) {
      setError("La selección mínima no puede superar la máxima");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        required: formData.required,
        minSelections: min,
        maxSelections: max,
      };

      const result = group
        ? await updateModifierGroup({ id: group.id, ...payload })
        : await createModifierGroup({ ...payload, restaurantId });

      if (result.success && result.data) {
        onSuccess(result.data, !group);
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {group ? "Editar grupo" : "Nuevo grupo de modificadores"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                className={inputClass}
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ej: Sabores, Proteínas, Toppings"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Descripción</label>
              <input
                className={inputClass}
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Descripción opcional para el cliente"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, required: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="required" className="text-sm text-gray-700">
                Selección obligatoria
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Mínimo de opciones</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={formData.minSelections}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      minSelections: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Máximo de opciones</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={formData.maxSelections}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      maxSelections: e.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  1 = selección única, &gt;1 = múltiple
                </p>
              </div>
            </div>
          </div>

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
              {group ? "Actualizar" : "Crear"} grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

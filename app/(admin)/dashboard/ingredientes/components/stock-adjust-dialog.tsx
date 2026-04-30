"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { adjustIngredientStock } from "@/actions/Ingredients";
import type { IngredientWithStats } from "@/types/ingredients";

type Props = {
  ingredient: IngredientWithStats;
  branchId: string;
  onClose: () => void;
  onSuccess: (updated: IngredientWithStats) => void;
};

export default function StockAdjustDialog({
  ingredient,
  branchId,
  onClose,
  onSuccess,
}: Props) {
  const [quantity, setQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty === 0) {
      setError("Ingresá una cantidad válida distinta de cero");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await adjustIngredientStock({
        ingredientId: ingredient.id,
        branchId,
        quantity: qty,
      });

      if (result.success) {
        const newStock = Math.max(0, ingredient.stock + qty);
        onSuccess({ ...ingredient, stock: newStock });
        onClose();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Error inesperado al ajustar el stock");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Ajustar stock
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{ingredient.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <span className="text-gray-500">Stock actual:</span>{" "}
              <span className="font-medium text-gray-900">
                {ingredient.stock}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad a ajustar *
              </label>
              <input
                className={inputClass}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.001"
                placeholder="Positivo = agregar, negativo = restar"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Usá valores positivos para agregar stock y negativos para
                restar.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
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
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

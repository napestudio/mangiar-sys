"use client";

import { Edit, Trash2, TrendingUp } from "lucide-react";
import type { IngredientWithStats } from "@/types/ingredients";
import {
  getWeightUnitShortLabel,
  getVolumeUnitShortLabel,
} from "@/app/(admin)/dashboard/menu-items/lib/units";
import { formatCurrency } from "@/lib/currency";

type Props = {
  ingredients: IngredientWithStats[];
  onEdit: (ingredient: IngredientWithStats) => void;
  onDelete: (ingredient: IngredientWithStats) => void;
  onAdjustStock: (ingredient: IngredientWithStats) => void;
};

function unitLabel(ing: IngredientWithStats): string {
  if (ing.weightUnit) return getWeightUnitShortLabel(ing.weightUnit);
  if (ing.volumeUnit) return getVolumeUnitShortLabel(ing.volumeUnit);
  return "u";
}

export default function IngredientsTable({
  ingredients,
  onEdit,
  onDelete,
  onAdjustStock,
}: Props) {
  if (ingredients.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">No hay ingredientes registrados.</p>
        <p className="text-xs mt-1">
          Creá el primer ingrediente usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Unidad
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Costo / unidad
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            {/* <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              En productos
            </th> */}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ingredients.map((ing) => {
            const unit = unitLabel(ing);
            const lowStock = ing.minStock !== null && ing.stock < ing.minStock;
            return (
              <tr key={ing.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {ing.name}
                  {ing.description && (
                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                      {ing.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{unit}</td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {formatCurrency(ing.costPerUnit)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-medium ${lowStock ? "text-red-600" : "text-gray-900"}`}
                  >
                    {ing.stock.toFixed(2)} {unit}
                  </span>
                  {lowStock && (
                    <span className="ml-1 text-xs text-red-500">(bajo)</span>
                  )}
                </td>
                {/* <td className="px-4 py-3 text-right text-gray-500">
                  {ing.usedInProducts}
                </td> */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onAdjustStock(ing)}
                      title="Ajustar stock"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(ing)}
                      title="Editar"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(ing)}
                      title="Eliminar"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { deleteIngredient } from "@/actions/Ingredients";
import { useToast } from "@/hooks/use-toast";
import type { IngredientWithStats } from "@/types/ingredients";
import IngredientsTable from "./ingredients-table";
import IngredientDialog from "./ingredient-dialog";
import StockAdjustDialog from "./stock-adjust-dialog";

type Props = {
  initialIngredients: IngredientWithStats[];
  restaurantId: string;
  branchId: string;
};

export default function IngredientsClient({
  initialIngredients,
  restaurantId,
  branchId,
}: Props) {
  const { toast } = useToast();
  const [ingredients, setIngredients] =
    useState<IngredientWithStats[]>(initialIngredients);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<IngredientWithStats | null>(null);
  const [adjustingIngredient, setAdjustingIngredient] =
    useState<IngredientWithStats | null>(null);
  const [deletingIngredient, setDeletingIngredient] =
    useState<IngredientWithStats | null>(null);

  const filtered = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddNew = () => {
    setEditingIngredient(null);
    setShowDialog(true);
  };

  const handleEdit = (ing: IngredientWithStats) => {
    setEditingIngredient(ing);
    setShowDialog(true);
  };

  const handleSaveSuccess = (saved: IngredientWithStats, isNew: boolean) => {
    if (isNew) {
      setIngredients((prev) =>
        [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast({ title: "Ingrediente creado", description: saved.name });
    } else {
      setIngredients((prev) =>
        prev.map((ing) => (ing.id === saved.id ? saved : ing)),
      );
      toast({ title: "Ingrediente actualizado", description: saved.name });
    }
  };

  const handleStockSuccess = (updated: IngredientWithStats) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === updated.id ? updated : ing)),
    );
    toast({ title: "Stock ajustado", description: updated.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIngredient) return;
    const result = await deleteIngredient(deletingIngredient.id);
    if (result.success) {
      setIngredients((prev) =>
        prev.filter((ing) => ing.id !== deletingIngredient.id),
      );
      toast({
        title: "Ingrediente eliminado",
        description: deletingIngredient.name,
      });
    } else {
      toast({
        title: "Error al eliminar",
        description: result.error,
        variant: "destructive",
      });
    }
    setDeletingIngredient(null);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-neutral-50 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo ingrediente
        </button>
      </div>

      <IngredientsTable
        ingredients={filtered}
        onEdit={handleEdit}
        onDelete={setDeletingIngredient}
        onAdjustStock={setAdjustingIngredient}
      />

      {/* Create / Edit Dialog */}
      {showDialog && (
        <IngredientDialog
          ingredient={editingIngredient}
          restaurantId={restaurantId}
          branchId={branchId}
          onClose={() => setShowDialog(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Stock Adjust Dialog */}
      {adjustingIngredient && (
        <StockAdjustDialog
          ingredient={adjustingIngredient}
          branchId={branchId}
          onClose={() => setAdjustingIngredient(null)}
          onSuccess={handleStockSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {deletingIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              ¿Eliminar ingrediente?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              ¿Estás seguro de eliminar{" "}
              <strong>{deletingIngredient.name}</strong>? Esta acción no se
              puede deshacer.
              {deletingIngredient.usedInProducts > 0 && (
                <span className="block mt-1 text-amber-600">
                  Este ingrediente está en uso por{" "}
                  {deletingIngredient.usedInProducts} producto(s).
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingIngredient(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm bg-red-600 text-neutral-50 rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

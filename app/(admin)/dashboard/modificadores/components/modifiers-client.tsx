"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { deleteModifierGroup } from "@/actions/ModifierGroups";
import { useToast } from "@/hooks/use-toast";
import type { IngredientWithStats } from "@/types/ingredients";
import type { ModifierGroupWithOptions } from "@/types/modifiers";
import ModifierGroupsList from "./modifier-groups-list";
import ModifierGroupDialog from "./modifier-group-dialog";

type Props = {
  initialGroups: ModifierGroupWithOptions[];
  availableIngredients: IngredientWithStats[];
  restaurantId: string;
};

export default function ModifiersClient({
  initialGroups,
  availableIngredients,
  restaurantId,
}: Props) {
  const { toast } = useToast();
  const [groups, setGroups] =
    useState<ModifierGroupWithOptions[]>(initialGroups);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] =
    useState<ModifierGroupWithOptions | null>(null);
  const [deletingGroup, setDeletingGroup] =
    useState<ModifierGroupWithOptions | null>(null);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddNew = () => {
    setEditingGroup(null);
    setShowDialog(true);
  };

  const handleGroupSaved = (
    saved: ModifierGroupWithOptions,
    isNew: boolean,
  ) => {
    if (isNew) {
      setGroups((prev) =>
        [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast({ title: "Grupo creado", description: saved.name });
    } else {
      setGroups((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
      toast({ title: "Grupo actualizado", description: saved.name });
    }
  };

  const handleGroupUpdated = (updated: ModifierGroupWithOptions) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGroup) return;
    const result = await deleteModifierGroup(deletingGroup.id);
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      toast({ title: "Grupo eliminado", description: deletingGroup.name });
    } else {
      toast({
        title: "Error al eliminar",
        description: result.error,
        variant: "destructive",
      });
    }
    setDeletingGroup(null);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-neutral-50 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo grupo
        </button>
      </div>

      <ModifierGroupsList
        groups={filtered}
        availableIngredients={availableIngredients}
        onEditGroup={(g) => {
          setEditingGroup(g);
          setShowDialog(true);
        }}
        onDeleteGroup={setDeletingGroup}
        onGroupUpdated={handleGroupUpdated}
      />

      {showDialog && (
        <ModifierGroupDialog
          group={editingGroup}
          restaurantId={restaurantId}
          onClose={() => setShowDialog(false)}
          onSuccess={handleGroupSaved}
        />
      )}

      {deletingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              ¿Eliminar grupo?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              ¿Estás seguro de eliminar <strong>{deletingGroup.name}</strong> y
              todas sus opciones? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingGroup(null)}
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

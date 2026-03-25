"use client";

import { useState, useOptimistic, useTransition } from "react";
import { X, Trash2, Plus, Edit2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/Products";

type StationInfo = {
  id: string;
  name: string;
  color: string;
};

type Category = {
  id: string;
  name: string;
  order: number;
  restaurantId: string;
  station?: StationInfo | null;
};

type Station = {
  id: string;
  name: string;
  color: string;
};

type CategoryDialogProps = {
  categories: Category[];
  restaurantId: string;
  stations: Station[];
  onClose: () => void;
  onSuccess: () => void;
};

type OptimisticAction =
  | { type: "create"; tempId: string; name: string; station: StationInfo | null }
  | { type: "update"; id: string; name: string; station: StationInfo | null | undefined }
  | { type: "delete"; id: string };

export function CategoryDialog({
  categories,
  restaurantId,
  stations,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingStationId, setEditingStationId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryStationId, setNewCategoryStationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic updates for categories
  const [optimisticCategories, setOptimisticCategories] = useOptimistic(
    categories,
    (state: Category[], action: OptimisticAction) => {
      switch (action.type) {
        case "create":
          return [
            ...state,
            {
              id: action.tempId,
              name: action.name,
              order: state.length,
              restaurantId,
              station: action.station,
            },
          ];
        case "update":
          return state.map((cat) =>
            cat.id === action.id
              ? {
                  ...cat,
                  name: action.name,
                  station: action.station === undefined ? cat.station : action.station,
                }
              : cat,
          );
        case "delete":
          return state.filter((cat) => cat.id !== action.id);
        default:
          return state;
      }
    },
  );

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      setError("El nombre de la categoría es requerido");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const name = newCategoryName.trim();
    const stationId = newCategoryStationId || undefined;
    const station = stationId ? (stations.find((s) => s.id === stationId) ?? null) : null;

    setNewCategoryName("");
    setNewCategoryStationId("");
    setError(null);

    startTransition(async () => {
      setOptimisticCategories({ type: "create", tempId, name, station });

      const result = await createCategory({
        name,
        restaurantId,
        stationId,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Error al crear la categoría");
      }
    });
  };

  const handleUpdate = async (id: string, name: string) => {
    if (!name.trim()) {
      setError("El nombre de la categoría es requerido");
      return;
    }

    const trimmedName = name.trim();
    const stationId = editingStationId || null;
    const station = stationId ? (stations.find((s) => s.id === stationId) ?? null) : null;

    setEditingId(null);
    setEditingName("");
    setEditingStationId("");
    setError(null);

    startTransition(async () => {
      setOptimisticCategories({ type: "update", id, name: trimmedName, station });

      const result = await updateCategory({
        id,
        name: trimmedName,
        stationId,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Error al actualizar la categoría");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) {
      return;
    }

    setError(null);

    startTransition(async () => {
      setOptimisticCategories({ type: "delete", id });

      const result = await deleteCategory(id);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Error al eliminar la categoría");
      }
    });
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingStationId(category.station?.id ?? "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingStationId("");
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestionar Categorías
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Add new category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nueva Categoría
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
                placeholder="Nombre de la categoría"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPending}
              />
              {stations.length > 0 && (
                <select
                  value={newCategoryStationId}
                  onChange={(e) => setNewCategoryStationId(e.target.value)}
                  disabled={isPending}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Sin estación</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={handleCreate}
                disabled={isPending || !newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar
              </button>
            </div>
            {stations.length === 0 && (
              <p className="text-xs text-amber-600">
                No hay estaciones configuradas. Configura estaciones e impresoras para que las categorías puedan imprimir.
              </p>
            )}
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Categorías Existentes ({optimisticCategories.length})
            </label>
            {optimisticCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay categorías. Crea la primera categoría arriba.
              </div>
            ) : (
              <div className="space-y-2">
                {optimisticCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {editingId === category.id ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdate(category.id, editingName);
                            } else if (e.key === "Escape") {
                              cancelEditing();
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isPending}
                          autoFocus
                        />
                        {stations.length > 0 && (
                          <select
                            value={editingStationId}
                            onChange={(e) => setEditingStationId(e.target.value)}
                            disabled={isPending}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                          >
                            <option value="">Sin estación</option>
                            {stations.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => handleUpdate(category.id, editingName)}
                          disabled={isPending || !editingName.trim()}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isPending}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {category.name}
                          </span>
                          {category.station ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `${category.station.color}20`,
                                color: category.station.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: category.station.color }}
                              />
                              {category.station.name}
                            </span>
                          ) : (
                            stations.length > 0 && (
                              <span className="text-xs text-gray-400">
                                Sin estación
                              </span>
                            )
                          )}
                        </div>
                        <button
                          onClick={() => startEditing(category)}
                          disabled={isPending}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar categoría"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

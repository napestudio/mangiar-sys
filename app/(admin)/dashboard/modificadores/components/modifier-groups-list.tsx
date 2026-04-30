"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
import type { IngredientWithStats } from "@/types/ingredients";
import type {
  ModifierGroupWithOptions,
  ModifierOptionData,
} from "@/types/modifiers";
import ModifierOptionDialog from "./modifier-option-dialog";
import { deleteModifierOption } from "@/actions/ModifierGroups";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { UnitType } from "@/app/generated/prisma";
import {
  getWeightUnitShortLabel,
  getVolumeUnitShortLabel,
} from "@/app/(admin)/dashboard/menu-items/lib/units";

function ingredientLinkLabel(
  l: ModifierOptionData["ingredientLinks"][number],
): string {
  let unit: string;
  if (l.ingredientUnitType === UnitType.WEIGHT)
    unit = getWeightUnitShortLabel(l.weightUnit ?? l.ingredientWeightUnit);
  else if (l.ingredientUnitType === UnitType.VOLUME)
    unit = getVolumeUnitShortLabel(l.volumeUnit ?? l.ingredientVolumeUnit);
  else unit = "u";
  return `${l.quantity} ${unit} ${l.ingredientName}`;
}

type Props = {
  groups: ModifierGroupWithOptions[];
  availableIngredients: IngredientWithStats[];
  onEditGroup: (group: ModifierGroupWithOptions) => void;
  onDeleteGroup: (group: ModifierGroupWithOptions) => void;
  onGroupUpdated: (updated: ModifierGroupWithOptions) => void;
};

export default function ModifierGroupsList({
  groups,
  availableIngredients,
  onEditGroup,
  onDeleteGroup,
  onGroupUpdated,
}: Props) {
  const { toast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingOption, setEditingOption] = useState<{
    groupId: string;
    option: ModifierOptionData | null;
  } | null>(null);

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">No hay grupos de modificadores.</p>
        <p className="text-xs mt-1">
          Creá el primer grupo usando el botón de arriba.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOptionSaved = (
    saved: ModifierOptionData,
    isNew: boolean,
    groupId: string,
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const updatedOptions = isNew
      ? [...group.options, saved].sort((a, b) => a.order - b.order)
      : group.options.map((o) => (o.id === saved.id ? saved : o));
    onGroupUpdated({ ...group, options: updatedOptions });
    toast({
      title: isNew ? "Opción creada" : "Opción actualizada",
      description: saved.name,
    });
  };

  const handleDeleteOption = async (
    groupId: string,
    option: ModifierOptionData,
  ) => {
    const result = await deleteModifierOption(option.id);
    if (result.success) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      onGroupUpdated({
        ...group,
        options: group.options.filter((o) => o.id !== option.id),
      });
      toast({ title: "Opción eliminada", description: option.name });
    } else {
      toast({
        title: "Error al eliminar",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-3">
        {groups.map((group) => {
          const isOpen = expandedIds.has(group.id);
          return (
            <div
              key={group.id}
              className="border border-gray-200 rounded-lg bg-white"
            >
              {/* Group header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleExpand(group.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">
                    {group.name}
                  </span>
                  {group.description && (
                    <span className="ml-2 text-sm text-gray-500">
                      {group.description}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-gray-400">
                    {group.options.length} opción(es) ·{" "}
                    {group.required ? "Obligatorio" : "Opcional"} ·{" "}
                    {group.maxSelections === 1
                      ? "Única"
                      : `Hasta ${group.maxSelections}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setEditingOption({ groupId: group.id, option: null })
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Opción
                  </button>
                  <button
                    onClick={() => onEditGroup(group)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGroup(group)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options list */}
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-2">
                  {group.options.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 italic">
                      Sin opciones. Agregá la primera usando el botón
                      `&quot`Opción`&quot`.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-normal">Nombre</th>
                          <th className="text-right py-2 font-normal">
                            Precio
                          </th>
                          <th className="text-right py-2 font-normal">
                            Ingredientes
                          </th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.options.map((opt) => (
                          <tr
                            key={opt.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2 text-gray-900">
                              {opt.name}
                              {opt.isDefault && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                              {!opt.isAvailable && (
                                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                  No disponible
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right text-gray-700">
                              {opt.priceAdjustment === 0
                                ? "—"
                                : opt.priceAdjustment > 0
                                  ? `+${formatCurrency(opt.priceAdjustment)}`
                                  : `-${formatCurrency(Math.abs(opt.priceAdjustment))}`}
                            </td>
                            <td className="py-2 text-right text-gray-500 text-xs">
                              {opt.ingredientLinks.length > 0
                                ? opt.ingredientLinks
                                    .map(
                                      (l) => ingredientLinkLabel(l),
                                    )
                                    .join(", ")
                                : "—"}
                            </td>
                            <td className="py-2">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() =>
                                    setEditingOption({
                                      groupId: group.id,
                                      option: opt,
                                    })
                                  }
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteOption(group.id, opt)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingOption && (
        <ModifierOptionDialog
          option={editingOption.option}
          groupId={editingOption.groupId}
          availableIngredients={availableIngredients}
          onClose={() => setEditingOption(null)}
          onSuccess={(saved, isNew) => {
            handleOptionSaved(saved, isNew, editingOption.groupId);
            setEditingOption(null);
          }}
        />
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SerializedMenuItem } from "@/actions/menus";
import { updateMenuItem, removeMenuItem } from "@/actions/menus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Trash2, Star, Eye, EyeOff, Pencil } from "lucide-react";
import { EditMenuItemDialog } from "./edit-menu-item-dialog";

interface SortableItemProps {
  id: string;
  item: SerializedMenuItem;
  onItemUpdated: (data: Partial<SerializedMenuItem>) => void;
  onItemRemoved: () => void;
  isPending?: boolean;
  isInGroup?: boolean;
}

export function SortableItem({
  id,
  item,
  onItemUpdated,
  onItemRemoved,
  isPending: parentPending = false,
  isInGroup = false,
}: SortableItemProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Local optimistic state for immediate feedback
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured);
  const [customPrice, setCustomPrice] = useState(item.customPrice);
  const [customDescription, setCustomDescription] = useState(item.customDescription ?? null);

  const isLoading = isPending || parentPending;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleAvailability = () => {
    const newValue = !isAvailable;
    setIsAvailable(newValue); // Optimistic
    startTransition(async () => {
      const result = await updateMenuItem(item.id, { isAvailable: newValue });
      if (result.success) {
        onItemUpdated({ isAvailable: newValue });
      } else {
        setIsAvailable(!newValue); // Revert
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al actualizar" });
      }
    });
  };

  const handleToggleFeatured = () => {
    const newValue = !isFeatured;
    setIsFeatured(newValue); // Optimistic
    startTransition(async () => {
      const result = await updateMenuItem(item.id, { isFeatured: newValue });
      if (result.success) {
        onItemUpdated({ isFeatured: newValue });
      } else {
        setIsFeatured(!newValue); // Revert
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al actualizar" });
      }
    });
  };

  const handleRemove = () => {
    onItemRemoved(); // Optimistic removal
    startTransition(async () => {
      const result = await removeMenuItem(item.id);
      if (!result.success) {
        // Can't easily "add back" a removed item from this level — parent handles revert
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al eliminar" });
      }
    });
  };

  const handleItemUpdatedFromDialog = (data: Partial<SerializedMenuItem>) => {
    if (data.isAvailable !== undefined) setIsAvailable(data.isAvailable);
    if (data.isFeatured !== undefined) setIsFeatured(data.isFeatured);
    if ("customPrice" in data) setCustomPrice(data.customPrice ?? null);
    if ("customDescription" in data) setCustomDescription(data.customDescription ?? null);
    onItemUpdated(data);
  };

  const displayPrice = customPrice ?? item.product?.basePrice;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 p-3 bg-white border rounded-lg ${
          isDragging ? "opacity-50 shadow-lg border-blue-500" : "border-gray-200"
        } ${isInGroup ? "ml-4 border-l-2 border-l-red-300" : ""}`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
          disabled={isLoading}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {item.product?.name || "Producto desconocido"}
          </div>
          {item.product?.description && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {item.product.description}
            </div>
          )}
          <div className="flex gap-1 mt-1 flex-wrap">
            {isFeatured && (
              <Badge variant="default" className="text-[10px] h-4 bg-amber-500">
                <Star className="mr-0.5 h-2 w-2" />
                Destacado
              </Badge>
            )}
            {!isAvailable && (
              <Badge variant="secondary" className="text-[10px] h-4">
                No disponible
              </Badge>
            )}
            {displayPrice != null && (
              <Badge variant="outline" className="text-[10px] h-4">
                ${displayPrice}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleFeatured}
            disabled={isLoading}
            title={isFeatured ? "Quitar destacado" : "Marcar como destacado"}
          >
            <Star
              className={`h-3.5 w-3.5 ${
                isFeatured ? "fill-amber-500 text-amber-500" : ""
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleAvailability}
            disabled={isLoading}
            title={isAvailable ? "Marcar no disponible" : "Marcar disponible"}
          >
            {isAvailable ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-blue-600"
            onClick={() => setIsEditOpen(true)}
            disabled={isLoading}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isLoading}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <EditMenuItemDialog
        item={{ ...item, isAvailable, isFeatured, customPrice, customDescription }}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onItemUpdated={handleItemUpdatedFromDialog}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{item.product?.name}&quot; de esta sección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRemove}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

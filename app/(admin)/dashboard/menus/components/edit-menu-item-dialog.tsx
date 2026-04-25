"use client";

import { updateMenuItem } from "@/actions/menus";
import type { SerializedMenuItem } from "@/actions/menus";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface EditMenuItemDialogProps {
  item: SerializedMenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (data: Partial<SerializedMenuItem>) => void;
}

export function EditMenuItemDialog({
  item,
  open,
  onOpenChange,
  onItemUpdated,
}: EditMenuItemDialogProps) {
  const { toast } = useToast();

  const [customPrice, setCustomPrice] = useState<string>(
    item.customPrice?.toString() || "",
  );
  const [customDescription, setCustomDescription] = useState<string>(
    item.customDescription || "",
  );
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured);

  // Reset form state every time the dialog opens so it reflects the current item
  useEffect(() => {
    if (open) {
      setCustomPrice(item.customPrice?.toString() || "");
      setCustomDescription(item.customDescription || "");
      setIsAvailable(item.isAvailable);
      setIsFeatured(item.isFeatured);
    }
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCustomPrice = customPrice ? Number(customPrice) : null;
    const newCustomDescription = customDescription.trim() || null;
    const update = { customPrice: newCustomPrice, customDescription: newCustomDescription, isAvailable, isFeatured };

    // Optimistic: close immediately and update parent
    onItemUpdated(update);
    onOpenChange(false);

    // Fire server action in background
    updateMenuItem(item.id, update).then((result) => {
      if (!result.success) {
        // Revert
        onItemUpdated({
          customPrice: item.customPrice,
          customDescription: item.customDescription,
          isAvailable: item.isAvailable,
          isFeatured: item.isFeatured,
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al actualizar el producto",
        });
      }
    });
  };

  const basePrice = item.product?.basePrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Producto en Menú</DialogTitle>
            <DialogDescription>{item.product?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Custom Price */}
            <div className="space-y-2">
              <Label htmlFor="customPrice">
                Precio Personalizado (opcional)
              </Label>
              <NumberInput
                id="customPrice"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={basePrice?.toString() || "0.00"}
              />
              <p className="text-xs text-gray-500">
                Deja vacío para usar el precio base (
                {basePrice ? `$${basePrice.toFixed(2)}` : "no disponible"})
              </p>
            </div>

            {/* Custom Description */}
            <div className="space-y-2">
              <Label htmlFor="customDescription">
                Descripción Personalizada (opcional)
              </Label>
              <Textarea
                id="customDescription"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={item.product?.description || "Descripción del producto"}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Deja vacío para usar la descripción base del producto
              </p>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              />
              <Label
                htmlFor="isFeatured"
                className="font-normal cursor-pointer"
              >
                Producto destacado
              </Label>
            </div>
            {/* Available Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAvailable"
                checked={isAvailable}
                onCheckedChange={(checked) =>
                  setIsAvailable(checked as boolean)
                }
              />
              <Label
                htmlFor="isAvailable"
                className="font-normal cursor-pointer"
              >
                Disponible
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

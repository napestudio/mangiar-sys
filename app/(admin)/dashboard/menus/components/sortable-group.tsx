"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  SerializedMenuSection,
  SerializedMenuItemGroup,
  SerializedMenuItem,
} from "@/actions/menus";
import {
  addMenuItem,
  updateMenuItemGroup,
  reorderMenuItems,
  getAvailableProducts,
} from "@/actions/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  GripVertical,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronRight,
  FolderOpen,
  Plus,
} from "lucide-react";
import { SortableItem } from "./sortable-item";

interface SortableGroupProps {
  id: string;
  group: SerializedMenuItemGroup;
  section: SerializedMenuSection;
  restaurantId: string;
  onGroupUpdated: (data: Partial<SerializedMenuItemGroup>) => void;
  onGroupItemUpdated: (itemId: string, data: Partial<SerializedMenuItem>) => void;
  onGroupItemRemoved: (itemId: string) => void;
  onDelete: () => void;
  isPending?: boolean;
}

export function SortableGroup({
  id,
  group,
  section,
  restaurantId,
  onGroupUpdated,
  onGroupItemUpdated,
  onGroupItemRemoved,
  onDelete,
  isPending: parentPending = false,
}: SortableGroupProps) {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending || parentPending;
  const isOptimisticPending = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Local state
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(group.name);
  const [displayDescription, setDisplayDescription] = useState(group.description || "");
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description || "");
  const [items, setItems] = useState<SerializedMenuItem[]>(group.menuItems || []);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Add item dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<
    Array<{
      id: string;
      name: string;
      description: string | null;
      categoryId: string | null;
      category: { name: string } | null;
    }>
  >([]);
  const productsCache = useRef<typeof availableProducts | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [showCustomPrice, setShowCustomPrice] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Sync items when group changes (skip during optimistic updates)
  useEffect(() => {
    if (isOptimisticPending.current) return;
    setItems(group.menuItems || []);
  }, [group.menuItems]);

  // Sync display name/description when group prop changes (skip during optimistic)
  useEffect(() => {
    if (isOptimisticPending.current) return;
    setDisplayName(group.name);
    setDisplayDescription(group.description || "");
  }, [group.name, group.description]);

  // DnD sensors for internal sorting
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Get all product IDs in the section (for deduplication)
  const getAllSectionItemIds = useCallback(() => {
    const ids = new Set<string>();
    section.menuItems?.forEach((item) => ids.add(item.productId));
    section.menuItemGroups?.forEach((g) => {
      g.menuItems?.forEach((item) => ids.add(item.productId));
    });
    return ids;
  }, [section]);

  const loadAvailableProducts = useCallback(async () => {
    const alreadyAdded = getAllSectionItemIds();
    if (productsCache.current) {
      setAvailableProducts(productsCache.current.filter((p) => !alreadyAdded.has(p.id)));
      return;
    }
    const products = await getAvailableProducts(restaurantId);
    productsCache.current = products;
    setAvailableProducts(products.filter((p) => !alreadyAdded.has(p.id)));
  }, [restaurantId, getAllSectionItemIds]);

  useEffect(() => {
    if (isAddDialogOpen) {
      loadAvailableProducts();
    }
  }, [isAddDialogOpen, loadAvailableProducts]);

  // Handle save edit — optimistic
  const handleSaveEdit = () => {
    if (!editName.trim()) return;

    const prevName = displayName;
    const prevDescription = displayDescription;
    const newName = editName.trim();
    const newDescription = editDescription.trim();

    // Optimistic update
    setDisplayName(newName);
    setDisplayDescription(newDescription);
    setIsEditing(false);
    isOptimisticPending.current = true;

    updateMenuItemGroup(group.id, {
      name: newName,
      description: newDescription || undefined,
    }).then((result) => {
      isOptimisticPending.current = false;
      if (result.success) {
        onGroupUpdated({ name: newName, description: newDescription || null });
      } else {
        setDisplayName(prevName);
        setDisplayDescription(prevDescription);
        setEditName(prevName);
        setEditDescription(prevDescription);
        setIsEditing(true);
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al guardar el grupo" });
      }
    });
  };

  // Handle internal item drag end — no onUpdate needed (local state already updated)
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => `group-item-${item.id}` === active.id);
    const newIndex = items.findIndex((item) => `group-item-${item.id}` === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems); // Optimistic

    startTransition(async () => {
      const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
      const result = await reorderMenuItems(updates);
      if (!result.success) {
        setItems(items); // Revert
        toast({ variant: "destructive", title: "Error", description: "Error al reordenar" });
      }
      // No onUpdate() — local state is correct
    });
  };

  // Handle add item — optimistic with temp ID
  const handleAddItem = async () => {
    if (!selectedProductId) return;

    const selectedProduct = availableProducts.find((p) => p.id === selectedProductId);
    if (!selectedProduct) return;

    const productId = selectedProductId;
    const customPriceValue = customPrice ? Number(customPrice) : undefined;
    const featuredValue = isFeatured;

    setIsAddDialogOpen(false);
    setSelectedProductId("");
    setSearchQuery("");
    setCustomPrice("");
    setShowCustomPrice(false);
    setIsFeatured(false);

    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticItem: SerializedMenuItem = {
      id: tempId,
      order: items.length,
      productId,
      menuSectionId: section.id,
      menuItemGroupId: group.id,
      customPrice: customPriceValue ?? null,
      customDescription: null,
      isAvailable: true,
      isFeatured: featuredValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: {
        id: productId,
        name: selectedProduct.name,
        description: selectedProduct.description,
        imageUrl: null,
        categoryId: selectedProduct.categoryId,
        tags: [],
      },
    };

    const previousItems = items;
    isOptimisticPending.current = true;
    setItems((prev) => [...prev, optimisticItem]);
    // Invalidate product cache so newly added product is excluded next time
    productsCache.current = null;

    startTransition(async () => {
      const result = await addMenuItem({
        menuSectionId: section.id,
        productId,
        menuItemGroupId: group.id,
        order: previousItems.length,
        isAvailable: true,
        isFeatured: featuredValue,
        customPrice: customPriceValue,
      });

      if (result.success && result.menuItem) {
        setItems((prev) => prev.map((item) => (item.id === tempId ? result.menuItem! : item)));
        isOptimisticPending.current = false;
      } else {
        setItems(previousItems);
        isOptimisticPending.current = false;
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al agregar el producto" });
      }
    });
  };

  // Item-level callbacks (update local items state + propagate up)
  const handleItemUpdated = (itemId: string, data: Partial<SerializedMenuItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
    );
    onGroupItemUpdated(itemId, data);
  };

  const handleItemRemoved = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    onGroupItemRemoved(itemId);
  };

  const filteredProducts = availableProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg ${
        isDragging ? "opacity-50 shadow-lg border-red-500" : "border-red-200"
      } border-l-4 border-l-red-500`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Group header */}
        <div className="flex items-center gap-2 p-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
            disabled={isLoading}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>

          {/* Expand/collapse */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>

          {/* Group info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nombre del grupo"
                  className="h-8"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descripcion (opcional)"
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={isLoading}>
                    <Check className="mr-1 h-3 w-3" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(displayName);
                      setEditDescription(displayDescription);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="font-medium text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-red-500" />
                  {displayName}
                </div>
                {displayDescription && (
                  <div className="text-xs text-gray-500 mt-0.5">{displayDescription}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {items.length} producto{items.length !== 1 ? "s" : ""}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditName(displayName);
                  setEditDescription(displayDescription);
                  setIsEditing(true);
                }}
                disabled={isLoading}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600"
                onClick={onDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Group content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {!isMounted ? (
              <div className="text-center py-4 text-gray-500 text-xs">Cargando...</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveItemId(e.active.id as string)}
                onDragEnd={handleItemDragEnd}
              >
                <SortableContext
                  items={items.map((item) => `group-item-${item.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-xs border border-dashed border-gray-300 rounded ml-4">
                      No hay productos en este grupo
                    </div>
                  ) : (
                    items.map((item) => (
                      <SortableItem
                        key={`group-item-${item.id}`}
                        id={`group-item-${item.id}`}
                        item={item}
                        onItemUpdated={(data) => handleItemUpdated(item.id, data)}
                        onItemRemoved={() => handleItemRemoved(item.id)}
                        isPending={isLoading}
                        isInGroup={true}
                      />
                    ))
                  )}
                </SortableContext>

                <DragOverlay>
                  {activeItemId ? (
                    <div className="bg-white shadow-lg rounded-lg border-2 border-blue-500 opacity-90 p-3">
                      <span className="text-sm font-medium">
                        {items.find((i) => `group-item-${i.id}` === activeItemId)?.product?.name}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Add item button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full ml-4 text-xs h-7 border-green-600 text-green-700 hover:bg-green-50"
            >
              <Plus className="mr-1 h-3 w-3" />
              Agregar Producto al Grupo
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              Agregar producto al grupo &quot;{displayName}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">
                Producto <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="product"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setSelectedProductId("");
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Buscar producto..."
                  autoComplete="off"
                />
                {showSuggestions && searchQuery && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No se encontraron productos</div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedProductId(product.id);
                            setSearchQuery(product.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">{product.name}</div>
                          {product.category && (
                            <div className="text-xs text-gray-500">{product.category.name}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedProductId && (
                <p className="text-xs text-green-600">Producto seleccionado</p>
              )}
            </div>

            {!showCustomPrice ? (
              <button
                type="button"
                onClick={() => setShowCustomPrice(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                + Agregar precio personalizado
              </button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customPrice">Precio Personalizado</Label>
                <NumberInput
                  id="customPrice"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Deja vacío para usar precio base"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured-group"
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              />
              <Label htmlFor="featured-group" className="font-normal cursor-pointer">
                Marcar como producto destacado
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedProductId("");
                setSearchQuery("");
                setCustomPrice("");
                setShowCustomPrice(false);
                setIsFeatured(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedProductId}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

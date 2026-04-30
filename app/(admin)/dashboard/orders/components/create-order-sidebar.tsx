"use client";

import { useState, useEffect, useMemo } from "react";
import { createOrderWithItems, getAvailableProductsForOrder } from "@/actions/Order";
import { OrderType } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Save,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  Clock,
} from "lucide-react";
import { ClientPicker } from "@/components/dashboard/client-picker";
import { WaiterPicker } from "@/components/dashboard/waiter-picker";
import { CreateClientDialog } from "@/components/dashboard/create-client-dialog";
import { ModifierSelectionDialog } from "@/components/dashboard/modifier-selection-dialog";
import { ProductPicker } from "@/components/dashboard/product-picker";
import { PreOrderItemsList, type PreOrderItem } from "@/components/dashboard/pre-order-items-list";
import { type ClientData } from "@/actions/clients";
import { type OrderProduct } from "@/types/products";
import { convertLinkQuantityToBase } from "@/lib/unit-conversions";

interface CreateOrderSidebarProps {
  branchId: string;
  tables: Array<{
    id: string;
    number: number;
    name: string | null;
  }>;
  open: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId?: string, orderType?: OrderType) => void;
  initialOrderType?: OrderType | null;
}



export function CreateOrderSidebar({
  branchId,
  tables,
  open,
  onClose,
  onOrderCreated,
  initialOrderType,
}: CreateOrderSidebarProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [orderType, setOrderType] = useState<OrderType>(
    initialOrderType || OrderType.DINE_IN,
  );
  const [tableId, setTableId] = useState<string>("");
  const [partySize, setPartySize] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  // Scheduling state - only for TAKE_AWAY and DELIVERY
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Local items state - unified for all order types
  const [localItems, setLocalItems] = useState<PreOrderItem[]>([]);
  const [pendingProduct, setPendingProduct] = useState<OrderProduct | null>(null);

  // Create client dialog state
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Products state — fetched locally so we always use the correct price type
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch products whenever the sidebar opens, keyed on orderType for correct prices
  useEffect(() => {
    if (!open) return;
    setProductsLoading(true);
    getAvailableProductsForOrder(branchId, orderType)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [open, branchId, orderType]);

  // Update order type when initialOrderType changes
  useEffect(() => {
    if (initialOrderType) {
      setOrderType(initialOrderType);
    }
  }, [initialOrderType]);

  // Aggregate ingredient quantities already committed to the pre-order, in each
  // ingredient's base unit. Recomputed whenever localItems or products change.
  const consumedIngredients = useMemo(() => {
    const consumed: Record<string, number> = {};
    for (const item of localItems) {
      for (const mod of item.modifiers ?? []) {
        for (const product of products) {
          for (const group of product.modifierGroups ?? []) {
            const option = group.options.find((o) => o.id === mod.modifierOptionId);
            if (!option) continue;
            for (const link of option.ingredientLinks) {
              const perUnit = convertLinkQuantityToBase(
                link.quantity,
                link.ingredientUnitType,
                link.weightUnit,
                link.volumeUnit,
                link.ingredientWeightUnit,
                link.ingredientVolumeUnit,
              );
              const total = perUnit * (mod.quantity ?? 1) * item.quantity;
              consumed[link.ingredientId] = (consumed[link.ingredientId] ?? 0) + total;
            }
          }
        }
      }
    }
    return consumed;
  }, [localItems, products]);

  // ==================== PRODUCT MANAGEMENT (Local State) ====================

  const handleSelectProduct = (product: OrderProduct) => {
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setPendingProduct(product);
    } else {
      const existingIndex = localItems.findIndex(
        (item) => item.productId === product.id,
      );
      if (existingIndex >= 0) {
        setLocalItems(
          localItems.map((item, i) =>
            i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        );
      } else {
        setLocalItems([
          ...localItems,
          {
            productId: product.id,
            itemName: product.name,
            quantity: 1,
            price: Number(product.price),
            originalPrice: Number(product.price),
            categoryId: product.categoryId,
          },
        ]);
      }
    }
  };

  const handleModifierConfirm = (item: PreOrderItem) => {
    setLocalItems((prev) => [...prev, item]);
    setPendingProduct(null);
  };

  const handleUpdateItem = (index: number, item: PreOrderItem) => {
    setLocalItems(localItems.map((existing, i) => (i === index ? item : existing)));
  };

  const handleRemoveItem = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  // ==================== ORDER CREATION (Single Transaction) ====================

  const handleCreateOrder = async () => {
    // Validation: at least one product required
    if (localItems.length === 0) {
      alert("Agrega al menos un producto a la orden");
      return;
    }

    // Validation based on order type
    if (orderType === OrderType.DINE_IN && !tableId) {
      alert("Por favor selecciona una mesa");
      return;
    }

    if (isScheduled && !scheduledTime) {
      alert("Por favor selecciona la hora de retiro/entrega");
      return;
    }

    setIsLoading(true);

    // Create order with all items in a single transaction
    const result = await createOrderWithItems({
      branchId,
      type: orderType,
      tableId: orderType === OrderType.DINE_IN ? tableId : null,
      partySize: partySize ? parseInt(partySize) : null,
      clientId: selectedClient?.id || null,
      assignedToId: selectedWaiterId || null,
      description: description.trim() || null,
      scheduledAt:
        isScheduled && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`)
          : null,
      items: localItems.map((item) => ({
        productId: item.productId,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        notes: item.notes,
        modifiers: item.modifiers,
      })),
    });

    setIsLoading(false);

    if (result.success && result.data) {
      const orderId = result.data.id;
      const createdOrderType = result.data.type;
      resetForm();
      onClose();
      onOrderCreated?.(orderId, createdOrderType);
    } else {
      alert(result.error || "Error al crear la orden");
    }
  };

  // ==================== SHARED FUNCTIONS ====================

  const resetForm = () => {
    setOrderType(initialOrderType || OrderType.DINE_IN);
    setTableId("");
    setPartySize("");
    setSelectedClient(null);
    setSelectedWaiterId(null);
    setDescription("");
    setClientSearchQuery("");
    setLocalItems([]);
    setIsScheduled(false);
    setScheduledTime("");
    setScheduledDate(new Date().toISOString().slice(0, 10));
    setShowDatePicker(false);
  };

  const handleCreateNewClient = (searchQuery: string) => {
    setClientSearchQuery(searchQuery);
    setShowCreateClientDialog(true);
  };

  const handleClientCreated = (client: ClientData) => {
    setSelectedClient(client);
    setShowCreateClientDialog(false);
  };

  const handleClose = () => {
    if (localItems.length > 0) {
      if (
        confirm("¿Seguro que quieres cerrar? Perderás los productos agregados.")
      ) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  // Calculate subtotal
  const subtotal = localItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (!open) return null;

  const getOrderTypeIcon = () => {
    switch (orderType) {
      case OrderType.TAKE_AWAY:
        return <ShoppingBag className="h-5 w-5" />;
      case OrderType.DELIVERY:
        return <Truck className="h-5 w-5" />;
      default:
        return <UtensilsCrossed className="h-5 w-5" />;
    }
  };

  const getOrderTypeLabel = () => {
    switch (orderType) {
      case OrderType.TAKE_AWAY:
        return "Para Llevar";
      case OrderType.DELIVERY:
        return "Delivery";
      default:
        return "Para Comer Aquí";
    }
  };

  return (
    <>
      <div
        className="fixed h-svh inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            {getOrderTypeIcon()}
            <div>
              <h2 className="text-xl font-semibold">
                Nueva Orden - {getOrderTypeLabel()}
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ==================== DINE-IN: Table Selection ==================== */}
          {orderType === OrderType.DINE_IN && (
            <>
              {/* Table Selection */}
              <div className="space-y-2">
                <Label htmlFor="table">
                  Mesa <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={tableId}
                  onValueChange={setTableId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="table">
                    <SelectValue placeholder="Seleccionar mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Mesa {table.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Party Size */}
              <div className="space-y-2">
                <Label htmlFor="party-size">Personas</Label>
                <NumberInput
                  id="party-size"
                  min="1"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  placeholder="Ej: 4"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Client Picker - All order types */}
          <div className="space-y-2">
            <ClientPicker
              branchId={branchId}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              onCreateNew={handleCreateNewClient}
              label="Cliente"
              disabled={isLoading}
            />
          </div>

          {/* Show Client Info for Delivery */}
          {orderType === OrderType.DELIVERY && selectedClient && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">
                Información de Entrega
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {selectedClient.name}
                </p>
                {selectedClient.phone && (
                  <p>
                    <span className="font-medium">Teléfono:</span>{" "}
                    {selectedClient.phone}
                  </p>
                )}
                {(selectedClient.addressStreet ||
                  selectedClient.addressNumber) && (
                  <p>
                    <span className="font-medium">Dirección:</span>{" "}
                    {selectedClient.addressStreet}{" "}
                    {selectedClient.addressNumber}
                    {selectedClient.addressApartment &&
                      ` - Depto ${selectedClient.addressApartment}`}
                    {selectedClient.addressCity &&
                      `, ${selectedClient.addressCity}`}
                  </p>
                )}
                {selectedClient.notes && (
                  <p>
                    <span className="font-medium">Notas:</span>{" "}
                    {selectedClient.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Waiter/Staff Picker - All order types */}
          <div className="space-y-2">
            <WaiterPicker
              branchId={branchId}
              selectedWaiterId={selectedWaiterId}
              onSelectWaiter={setSelectedWaiterId}
              label={
                orderType === OrderType.DINE_IN
                  ? "Mesero/Cajero"
                  : "Atendido por"
              }
              disabled={isLoading}
            />
          </div>

          {/* Description/Notes - All order types */}
          <div className="space-y-2">
            <Label htmlFor="description">Notas / Instrucciones</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Scheduled Time - TAKE_AWAY and DELIVERY only */}
          {orderType !== OrderType.DINE_IN && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora de entrega / retiro
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isScheduled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsScheduled(false);
                    setScheduledTime("");
                    setScheduledDate(new Date().toISOString().slice(0, 10));
                    setShowDatePicker(false);
                  }}
                  disabled={isLoading}
                >
                  Lo antes posible
                </Button>
                <Button
                  type="button"
                  variant={isScheduled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsScheduled(true)}
                  disabled={isLoading}
                >
                  Programar
                </Button>
              </div>
              {isScheduled && (
                <div className="space-y-2">
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={isLoading}
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xl font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div>
                    {!showDatePicker ? (
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(true)}
                        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                      >
                        {new Date(`${scheduledDate}T00:00`).toLocaleDateString(
                          "es-AR",
                          { weekday: "long", day: "numeric", month: "long" },
                        )}{" "}
                        ›
                      </button>
                    ) : (
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        disabled={isLoading}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Section - All order types */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Productos <span className="text-red-500">*</span>
            </h3>

            {/* Product Picker */}
            <div className="space-y-2 mb-4">
              <ProductPicker
                products={products}
                onSelectProduct={handleSelectProduct}
                label=""
                placeholder="Buscar producto..."
                disabled={isLoading || productsLoading}
              />
            </div>

            {/* Items List */}
            {localItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
                <p>No hay productos</p>
                <p className="text-sm mt-1">
                  Agrega al menos un producto para crear la orden
                </p>
              </div>
            ) : (
              <PreOrderItemsList
                items={localItems}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                disabled={isLoading}
              />
            )}

            {/* Subtotal */}
            {localItems.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="text-lg font-bold">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <Button
            onClick={handleCreateOrder}
            disabled={isLoading || localItems.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              "Creando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Orden
              </>
            )}
          </Button>
        </div>

        {/* Create Client Dialog */}
        <CreateClientDialog
          open={showCreateClientDialog}
          onOpenChange={setShowCreateClientDialog}
          branchId={branchId}
          onSuccess={handleClientCreated}
          initialName={clientSearchQuery}
        />

      {/* Modifier Selection Dialog */}
      {pendingProduct && (
        <ModifierSelectionDialog
          product={pendingProduct}
          open={!!pendingProduct}
          onConfirm={handleModifierConfirm}
          onCancel={() => setPendingProduct(null)}
          consumedIngredients={consumedIngredients}
        />
      )}
      </div>
    </>
  );
}

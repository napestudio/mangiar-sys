"use client";

import {
  createMenuItem,
  deleteProductImage,
  reactivateMenuItem,
  setProductOnBranch,
  updateMenuItem,
} from "@/actions/Products";
import type {
  PriceType,
  ProductTag,
  UnitType,
  VolumeUnit,
  WeightUnit,
} from "@/app/generated/prisma";
import { ImageUpload } from "@/components/ui/image-upload";
import { NumberInput } from "@/components/ui/number-input";
import { GlutenFreeIcon } from "@/components/ui/tag-icons/GlutenFreeIcon";
import { SpicyHighIcon } from "@/components/ui/tag-icons/SpicyHighIcon";
import { SpicyIcon } from "@/components/ui/tag-icons/SpicyIcon";
import { SpicyMediumIcon } from "@/components/ui/tag-icons/SpicyMediumIcon";
import { VeganIcon } from "@/components/ui/tag-icons/VeganIcon";
import { VegetarianIcon } from "@/components/ui/tag-icons/VegetarianIcon";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  UNIT_TYPE_OPTIONS,
  VOLUME_UNIT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
} from "../lib/units";

// Serialized types for client components
type SerializedProductPrice = {
  id: string;
  productOnBranchId: string;
  type: PriceType;
  price: number;
};

type SerializedProductOnBranch = {
  id: string;
  productId: string;
  branchId: string;
  stock: number;
  minStock: number | null;
  maxStock: number | null;
  lastRestocked: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  prices: SerializedProductPrice[];
};

type SerializedCategory = {
  id: string;
  name: string;
  order: number;
  restaurantId: string;
};

type SerializedComboComponent = {
  id: string;
  comboId: string;
  componentId: string;
  quantity: number;
  component: {
    id: string;
    name: string;
    unitType: string;
  };
};

type ProductWithRelations = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string | null;
  unitType: UnitType;
  weightUnit: WeightUnit | null;
  volumeUnit: VolumeUnit | null;
  minStockAlert: number | null;
  trackStock: boolean;
  tags: ProductTag[];
  isActive: boolean;
  isCombo: boolean;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  categoryId: string | null;
  category: SerializedCategory | null;
  branches: SerializedProductOnBranch[];
  comboComponents: SerializedComboComponent[];
};

type AvailableComponent = {
  id: string;
  name: string;
};

const TAG_OPTIONS: {
  value: ProductTag;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  selectedClass: string;
}[] = [
  {
    value: "SPICY",
    label: "Picante Leve",
    icon: SpicyIcon,
    color: "text-red-400",
    selectedClass: "bg-red-50 border-red-300",
  },
  {
    value: "SPICY_MEDIUM",
    label: "Picante Medio",
    icon: SpicyMediumIcon,
    color: "text-red-500",
    selectedClass: "bg-red-50 border-red-400",
  },
  {
    value: "SPICY_HIGH",
    label: "Muy Picante",
    icon: SpicyHighIcon,
    color: "text-red-700",
    selectedClass: "bg-red-100 border-red-600",
  },
  {
    value: "VEGAN",
    label: "Vegano",
    icon: VeganIcon,
    color: "text-green-600",
    selectedClass: "bg-green-50 border-green-400",
  },
  {
    value: "VEGETARIAN",
    label: "Vegetariano",
    icon: VegetarianIcon,
    color: "text-emerald-600",
    selectedClass: "bg-emerald-50 border-emerald-400",
  },
  {
    value: "GLUTEN_FREE",
    label: "Sin TACC",
    icon: GlutenFreeIcon,
    color: "text-amber-600",
    selectedClass: "bg-amber-50 border-amber-400",
  },
  // { value: "DAIRY_FREE", label: "Sin Lácteos", icon: DairyFreeIcon, color: "text-blue-500", selectedClass: "bg-blue-50 border-blue-400" },
  // { value: "NUT_FREE", label: "Sin Frutos Secos", icon: NutFreeIcon, color: "text-red-500", selectedClass: "bg-red-50 border-red-400" },
  // { value: "NEW", label: "Nuevo", icon: NewIcon, color: "text-red-500", selectedClass: "bg-red-50 border-red-400" },
  // { value: "POPULAR", label: "Popular", icon: PopularIcon, color: "text-red-400", selectedClass: "bg-red-50 border-red-300" },
];

type ProductDialogProps = {
  item: ProductWithRelations | null;
  categories: SerializedCategory[];
  availableComponents: AvailableComponent[];
  restaurantId: string;
  branchId: string;
  onClose: () => void;
  onSuccess: (savedItem?: ProductWithRelations, isNewItem?: boolean) => void;
};

type ComponentRow = {
  componentId: string;
  quantity: string;
};

type FormData = {
  name: string;
  description: string;
  imageUrl: string;
  unitType: UnitType;
  weightUnit: WeightUnit | "";
  volumeUnit: VolumeUnit | "";
  minStockAlert: string;
  trackStock: boolean;
  tags: ProductTag[];
  categoryId: string;
  isActive: boolean;
  isCombo: boolean;
  components: ComponentRow[];
  // Datos de sucursal
  stock: string;
  prices: {
    dineIn: string;
    takeAway: string;
    delivery: string;
  };
};

export function ProductDialog({
  item,
  categories,
  availableComponents,
  restaurantId,
  branchId,
  onClose,
  onSuccess,
}: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inactiveDuplicate, setInactiveDuplicate] = useState<{
    id: string;
  } | null>(null);
  const [currentTab, setCurrentTab] = useState<
    "basic" | "prices" | "stock" | "components"
  >("basic");

  // Track original image URL for cleanup
  const [originalImageUrl] = useState(item?.imageUrl ?? null);

  // Obtener datos de la sucursal si estamos editando
  const branchData = item?.branches.find((b) => b.branchId === branchId);
  const existingPrices = {
    dineIn: branchData?.prices.find((p) => p.type === "DINE_IN"),
    takeAway: branchData?.prices.find((p) => p.type === "TAKE_AWAY"),
    delivery: branchData?.prices.find((p) => p.type === "DELIVERY"),
  };

  const [formData, setFormData] = useState<FormData>({
    name: item?.name ?? "",
    description: item?.description ?? "",
    imageUrl: item?.imageUrl ?? "",
    unitType: item?.unitType ?? "UNIT",
    weightUnit: item?.weightUnit ?? "",
    volumeUnit: item?.volumeUnit ?? "",
    minStockAlert: item?.minStockAlert ? item.minStockAlert.toString() : "",
    trackStock: item?.trackStock ?? false,
    tags: item?.tags ?? [],
    categoryId: item?.categoryId ?? "",
    isActive: item?.isActive ?? true,
    isCombo: item?.isCombo ?? false,
    components:
      item?.comboComponents?.map((cc) => ({
        componentId: cc.componentId,
        quantity: Math.round(cc.quantity).toString(),
      })) ?? [],
    stock: branchData?.stock ? branchData.stock.toString() : "0",
    prices: {
      dineIn: existingPrices.dineIn?.price
        ? existingPrices.dineIn.price.toString()
        : "",
      takeAway: existingPrices.takeAway?.price
        ? existingPrices.takeAway.price.toString()
        : "",
      delivery: existingPrices.delivery?.price
        ? existingPrices.delivery.price.toString()
        : "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("price_")) {
      // Convert DINE_IN -> dineIn, TAKE_AWAY -> takeAway, DELIVERY -> delivery
      const priceTypeEnum = name.replace("price_", "");
      let priceTypeKey: keyof FormData["prices"];

      if (priceTypeEnum === "DINE_IN") {
        priceTypeKey = "dineIn";
      } else if (priceTypeEnum === "TAKE_AWAY") {
        priceTypeKey = "takeAway";
      } else {
        priceTypeKey = "delivery";
      }

      setFormData((prev) => ({
        ...prev,
        prices: { ...prev.prices, [priceTypeKey]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnitType = e.target.value as UnitType;
    setFormData((prev) => ({
      ...prev,
      unitType: newUnitType,
      weightUnit: newUnitType === "WEIGHT" ? "KILOGRAM" : "",
      volumeUnit: newUnitType === "VOLUME" ? "LITER" : "",
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "El nombre del producto es requerido";
    }

    if (formData.unitType === "WEIGHT" && !formData.weightUnit) {
      return "Debe seleccionar una unidad de peso";
    }

    if (formData.unitType === "VOLUME" && !formData.volumeUnit) {
      return "Debe seleccionar una unidad de volumen";
    }

    // Validar que al menos un precio esté definido
    if (
      !formData.prices.dineIn &&
      !formData.prices.takeAway &&
      !formData.prices.delivery
    ) {
      return "Debe definir al menos un precio";
    }

    if (!formData.categoryId) {
      return "La categoría es obligatoria";
    }

    if (formData.isCombo) {
      if (formData.components.length === 0) {
        return "Un combo debe tener al menos un ingrediente";
      }
      for (const comp of formData.components) {
        if (!comp.componentId) {
          return "Todos los ingredientes deben tener un producto seleccionado";
        }
        const qty = parseInt(comp.quantity, 10);
        if (!qty || qty < 1 || !Number.isInteger(qty)) {
          return "Todos los ingredientes deben tener una cantidad entera mayor a 0";
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // 1. Crear o actualizar el producto
      let productId = item?.id;
      let savedProduct: ProductWithRelations | null = null;
      const isNewItem = !item;

      const comboPayload = formData.isCombo
        ? {
            isCombo: true as const,
            components: formData.components.map((c) => ({
              componentId: c.componentId,
              quantity: parseInt(c.quantity, 10),
            })),
          }
        : { isCombo: false as const, components: [] };

      if (item) {
        // Actualizar producto existente
        const result = await updateMenuItem({
          id: item.id,
          name: formData.name,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          unitType: formData.unitType,
          weightUnit: formData.weightUnit || undefined,
          volumeUnit: formData.volumeUnit || undefined,
          minStockAlert:
            !formData.isCombo && formData.minStockAlert
              ? parseFloat(formData.minStockAlert)
              : undefined,
          trackStock: formData.isCombo ? false : formData.trackStock,
          tags: formData.tags,
          categoryId: formData.categoryId || undefined,
          isActive: formData.isActive,
          ...comboPayload,
        });

        if (!result.success) {
          throw new Error(result.error);
        }
        if (!result.data) {
          throw new Error("Error inesperado");
        }

        productId = result.data.id;
        // Branches will be added after setting product on branch
        savedProduct = { ...result.data, branches: [], comboComponents: [] };
      } else {
        // Crear nuevo producto
        const result = await createMenuItem({
          name: formData.name,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          unitType: formData.unitType,
          weightUnit: formData.weightUnit || undefined,
          volumeUnit: formData.volumeUnit || undefined,
          minStockAlert:
            !formData.isCombo && formData.minStockAlert
              ? parseFloat(formData.minStockAlert)
              : undefined,
          trackStock: formData.isCombo ? false : formData.trackStock,
          tags: formData.tags,
          categoryId: formData.categoryId || undefined,
          restaurantId,
          isActive: formData.isActive,
          ...comboPayload,
        });

        if (!result.success) {
          const errMsg = result.error ?? "Error inesperado";
          if (errMsg.startsWith("INACTIVE_DUPLICATE:")) {
            setInactiveDuplicate({
              id: errMsg.replace("INACTIVE_DUPLICATE:", ""),
            });
            setLoading(false);
            return;
          }
          throw new Error(errMsg);
        }
        if (!result.data) {
          throw new Error("Error inesperado");
        }

        productId = result.data.id;
        // Branches will be added after setting product on branch
        savedProduct = { ...result.data, branches: [], comboComponents: [] };
      }

      // 2. Configurar el producto en la sucursal con precios
      if (productId) {
        const prices = [];
        if (formData.prices.dineIn) {
          prices.push({
            type: "DINE_IN" as const,
            price: parseFloat(formData.prices.dineIn),
          });
        }
        if (formData.prices.takeAway) {
          prices.push({
            type: "TAKE_AWAY" as const,
            price: parseFloat(formData.prices.takeAway),
          });
        }
        if (formData.prices.delivery) {
          prices.push({
            type: "DELIVERY" as const,
            price: parseFloat(formData.prices.delivery),
          });
        }

        const branchResult = await setProductOnBranch({
          productId,
          branchId,
          // Combos have no own stock — always 0
          stock: formData.isCombo ? 0 : parseFloat(formData.stock) || 0,
          isActive: formData.isActive,
          prices,
        });

        if (!branchResult.success || !branchResult.data) {
          throw new Error(branchResult.error);
        }

        // Update savedProduct with branch data
        if (savedProduct) {
          savedProduct = {
            ...savedProduct,
            branches: [branchResult.data],
          };
        }
      }

      // Clean up old image if it changed
      if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
        // Image was changed or removed - delete old one from Cloudinary
        deleteProductImage(originalImageUrl).catch((err) => {
          console.warn("Failed to delete old image:", err);
          // Don't fail the operation - deletion is cleanup, not critical
        });
      }

      // Call onSuccess with the saved product data for optimistic updates
      onSuccess(savedProduct || undefined, isNewItem);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar el producto";

      // Check for unique constraint errors
      if (
        errorMessage.includes("Unique constraint failed") &&
        errorMessage.includes("name")
      ) {
        setError(
          "Ya existe un producto con este nombre en tu restaurante. Por favor, usa un nombre diferente.",
        );
      } else if (
        errorMessage.includes("Unique constraint failed") &&
        errorMessage.includes("sku")
      ) {
        setError(
          "El código SKU ya está en uso. Por favor, usa un código diferente.",
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setCurrentTab("basic")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === "basic"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Información Básica
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("prices")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === "prices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Precios
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("stock")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === "stock"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Stock
          </button>
          {formData.isCombo && (
            <button
              type="button"
              onClick={() => setCurrentTab("components")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentTab === "components"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Ingredientes
              {formData.components.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {formData.components.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-180px)]"
        >
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {inactiveDuplicate && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-amber-800">
                  Ya existe un producto inactivo con el nombre &quot;
                  {formData.name}&quot;.
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  ¿Deseas reactivarlo en lugar de crear uno nuevo?
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const result = await reactivateMenuItem(
                        inactiveDuplicate.id,
                      );
                      if (result.success) {
                        setInactiveDuplicate(null);
                        onSuccess(undefined, false);
                        onClose();
                      } else {
                        setError(result.error ?? "Error inesperado");
                        setInactiveDuplicate(null);
                        setLoading(false);
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      "Reactivar producto"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setInactiveDuplicate(null)}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-300 rounded hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Información Básica */}
            {currentTab === "basic" && (
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Hamburguesa de carne"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción del producto..."
                  />
                </div>

                {/* Imagen del Producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Producto
                  </label>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, imageUrl: url }))
                    }
                    onRemove={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: JPG, PNG, WebP. Tamaño máximo: 5MB
                  </p>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Etiquetas / Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TAG_OPTIONS.map((tag) => {
                      const Icon = tag.icon;
                      const isSelected = formData.tags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tags: isSelected
                                ? prev.tags.filter((t) => t !== tag.value)
                                : [...prev.tags, tag.value],
                            }))
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? `${tag.selectedClass} font-medium`
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Icon
                            size={16}
                            className={isSelected ? tag.color : "text-gray-400"}
                          />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Estado Activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Producto activo
                  </label>
                </div>

                {/* Es un combo */}
                <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="isCombo"
                      checked={formData.isCombo}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          isCombo: checked,
                          trackStock: checked ? false : prev.trackStock,
                          components: checked ? prev.components : [],
                        }));
                        if (checked) setCurrentTab("components");
                      }}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-2 focus:ring-amber-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="isCombo"
                        className="text-sm font-medium text-amber-900 cursor-pointer"
                      >
                        Es un combo / promo
                      </label>
                      <p className="text-xs text-amber-700 mt-1">
                        El stock de este producto se gestiona automáticamente a
                        través de sus ingredientes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Stock */}
            {currentTab === "stock" && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gestión de Stock
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configura el inventario disponible en esta sucursal
                  </p>
                </div>

                {formData.isCombo && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800">
                      Este producto es un combo
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Su disponibilidad se calcula automáticamente a partir del
                      stock de sus ingredientes. No requiere stock propio.
                    </p>
                  </div>
                )}

                {!formData.isCombo && (
                  <>
                    {/* Tipo de Unidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Unidad *
                      </label>
                      <select
                        name="unitType"
                        value={formData.unitType}
                        onChange={handleUnitTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {UNIT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unidad de Peso (si aplica) */}
                    {formData.unitType === "WEIGHT" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unidad de Peso *
                        </label>
                        <select
                          name="weightUnit"
                          value={formData.weightUnit}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {WEIGHT_UNIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Unidad de Volumen (si aplica) */}
                    {formData.unitType === "VOLUME" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unidad de Volumen *
                        </label>
                        <select
                          name="volumeUnit"
                          value={formData.volumeUnit}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {VOLUME_UNIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Seguimiento de Stock */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          name="trackStock"
                          id="trackStock"
                          checked={formData.trackStock}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="trackStock"
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            Habilitar seguimiento de stock
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Si está deshabilitado, el producto siempre estará
                            disponible sin importar el stock.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Stock Mínimo */}
                    {formData.trackStock && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alerta de Stock Mínimo
                        </label>
                        <NumberInput
                          name="minStockAlert"
                          value={formData.minStockAlert}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          placeholder="Cantidad mínima antes de alertar"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se mostrará una alerta cuando el stock de cualquier
                          sucursal esté por debajo de este valor
                        </p>
                      </div>
                    )}

                    {!formData.trackStock ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-600">
                          El seguimiento de stock está desactivado para este
                          producto.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Activa la opción &quot;Habilitar seguimiento de
                          stock&quot; arriba para gestionar el inventario.
                        </p>
                      </div>
                    ) : (
                      <>
                        {!item && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Stock Actual *
                            </label>
                            <NumberInput
                              name="stock"
                              value={formData.stock}
                              onChange={handleChange}
                              min="0"
                              step="0.01"
                              required={formData.trackStock}
                              placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Stock disponible en esta sucursal. Para configurar
                              alertas, usa &quot;Alerta de Stock Mínimo&quot;
                              arriba.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab: Ingredientes */}
            {currentTab === "components" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Ingredientes del Combo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Definí qué productos incluye este combo y en qué cantidad.
                    El stock de cada ingrediente se descontará automáticamente
                    al vender el combo.
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.components.map((comp, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <select
                          value={comp.componentId}
                          onChange={(e) => {
                            const newComponents = [...formData.components];
                            newComponents[index] = {
                              ...newComponents[index],
                              componentId: e.target.value,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              components: newComponents,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccionar producto...</option>
                          {availableComponents
                            .filter((p) => p.id !== item?.id)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <NumberInput
                          value={comp.quantity}
                          onChange={(e) => {
                            const newComponents = [...formData.components];
                            newComponents[index] = {
                              ...newComponents[index],
                              quantity: e.target.value,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              components: newComponents,
                            }));
                          }}
                          min="1"
                          step="1"
                          placeholder="Cant."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            components: prev.components.filter(
                              (_, i) => i !== index,
                            ),
                          }));
                        }}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      components: [
                        ...prev.components,
                        { componentId: "", quantity: "1" },
                      ],
                    }));
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar ingrediente
                </button>

                {formData.components.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No hay ingredientes definidos. Agregá al menos uno.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Precios */}
            {currentTab === "prices" && (
              <div className="space-y-6 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Precios por Tipo de Servicio
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configura los precios según el tipo de servicio. Al menos un
                    precio es requerido.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Precio Comedor (DINE_IN) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Salón (para consumir en local)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <NumberInput
                        name="price_DINE_IN"
                        value={formData.prices.dineIn}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Precio Para Llevar (TAKE_AWAY) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Para Llevar
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <NumberInput
                        name="price_TAKE_AWAY"
                        value={formData.prices.takeAway}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Precio Delivery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Delivery
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <NumberInput
                        name="price_DELIVERY"
                        value={formData.prices.delivery}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-800">
                    <strong>Nota:</strong> Los precios son por unidad base
                    (unidad, kg, litro, etc.). Al menos un precio debe estar
                    configurado.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {item ? "Actualizar" : "Crear"} Producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import type { WeightUnit, VolumeUnit, UnitType } from "@/app/generated/prisma";

export type CreateModifierGroupInput = {
  restaurantId: string;
  name: string;
  description?: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
};

export type UpdateModifierGroupInput = {
  id: string;
  name?: string;
  description?: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
};

export type CreateModifierOptionInput = {
  groupId: string;
  name: string;
  priceAdjustment?: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  order?: number;
  ingredientLinks?: Array<{
    ingredientId: string;
    quantity: number;
    weightUnit?: WeightUnit;
    volumeUnit?: VolumeUnit;
  }>;
};

export type UpdateModifierOptionInput = {
  id: string;
  name?: string;
  priceAdjustment?: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  order?: number;
  ingredientLinks?: Array<{
    ingredientId: string;
    quantity: number;
    weightUnit?: WeightUnit;
    volumeUnit?: VolumeUnit;
  }>;
};

export type ModifierOptionData = {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
  isOutOfStock: boolean;
  order: number;
  ingredientLinks: Array<{
    ingredientId: string;
    ingredientName: string;
    ingredientUnitType: UnitType;
    quantity: number;
    stock: number;
    // Base unit of the ingredient (purchase unit)
    ingredientWeightUnit: WeightUnit | null;
    ingredientVolumeUnit: VolumeUnit | null;
    // Unit override for this link (what the user entered)
    weightUnit: WeightUnit | null;
    volumeUnit: VolumeUnit | null;
  }>;
};

export type ModifierGroupWithOptions = {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  restaurantId: string;
  options: ModifierOptionData[];
};

export type ResolvedModifierGroup = ModifierGroupWithOptions & {
  productOverride: {
    requiredOverride: boolean | null;
    minSelectionsOverride: number | null;
    maxSelectionsOverride: number | null;
    order: number;
  };
  effectiveRequired: boolean;
  effectiveMin: number;
  effectiveMax: number;
};

export type AttachModifierGroupInput = {
  productId: string;
  groupId: string;
  order?: number;
  requiredOverride?: boolean | null;
  minSelectionsOverride?: number | null;
  maxSelectionsOverride?: number | null;
};

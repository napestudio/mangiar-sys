import type { UnitType, WeightUnit, VolumeUnit } from "@/app/generated/prisma";

export type CreateIngredientInput = {
  name: string;
  description?: string;
  unitType: UnitType;
  weightUnit?: WeightUnit;
  volumeUnit?: VolumeUnit;
  costPerUnit: number;
  restaurantId: string;
};

export type UpdateIngredientInput = {
  id: string;
  name?: string;
  description?: string;
  unitType?: UnitType;
  weightUnit?: WeightUnit;
  volumeUnit?: VolumeUnit;
  costPerUnit?: number;
};

export type IngredientStockInput = {
  ingredientId: string;
  branchId: string;
  quantity: number; // positive = add, negative = deduct
};

export type IngredientWithStats = {
  id: string;
  name: string;
  description: string | null;
  unitType: UnitType;
  weightUnit: WeightUnit | null;
  volumeUnit: VolumeUnit | null;
  costPerUnit: number;
  restaurantId: string;
  stock: number;
  minStock: number | null;
  usedInProducts: number;
};

export type ProductIngredientEntry = {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitType: UnitType;
  // Base unit of the ingredient (purchase unit)
  weightUnit: WeightUnit | null;
  volumeUnit: VolumeUnit | null;
  // Unit override for this recipe link (what the user entered)
  linkWeightUnit: WeightUnit | null;
  linkVolumeUnit: VolumeUnit | null;
  costPerUnit: number;
  canBeRemoved: boolean;
};

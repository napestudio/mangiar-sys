import { UnitType, WeightUnit, VolumeUnit } from "@/app/generated/prisma";

/**
 * Weight unit values expressed in grams (base unit).
 */
const WEIGHT_IN_GRAMS: Record<WeightUnit, number> = {
  GRAM: 1,
  KILOGRAM: 1000,
  POUND: 453.59237,
  OUNCE: 28.349523125,
};

/**
 * Volume unit values expressed in millilitres (base unit).
 */
const VOLUME_IN_ML: Record<VolumeUnit, number> = {
  MILLILITER: 1,
  LITER: 1000,
  GALLON: 3785.411784,
  FLUID_OUNCE: 29.5735295625,
};

/**
 * Returns the factor to convert `quantity` expressed in `from` to the `to` unit.
 * E.g. getWeightConversionFactor(GRAM, KILOGRAM) === 0.001
 */
export function getWeightConversionFactor(from: WeightUnit, to: WeightUnit): number {
  return WEIGHT_IN_GRAMS[from] / WEIGHT_IN_GRAMS[to];
}

export function getVolumeConversionFactor(from: VolumeUnit, to: VolumeUnit): number {
  return VOLUME_IN_ML[from] / VOLUME_IN_ML[to];
}

/**
 * Converts `quantity` (expressed in `linkUnit`) to the ingredient's base unit.
 *
 * If `linkUnit` is null/undefined the quantity is returned unchanged (already
 * in the base unit).
 *
 * @param quantity    The amount as entered by the user.
 * @param unitType    The ingredient's UnitType (WEIGHT | VOLUME | UNIT).
 * @param linkWeight  The WeightUnit the user chose for this link (nullable).
 * @param linkVolume  The VolumeUnit the user chose for this link (nullable).
 * @param baseWeight  The ingredient's own WeightUnit (nullable).
 * @param baseVolume  The ingredient's own VolumeUnit (nullable).
 */
export function convertLinkQuantityToBase(
  quantity: number,
  unitType: UnitType,
  linkWeight: WeightUnit | null | undefined,
  linkVolume: VolumeUnit | null | undefined,
  baseWeight: WeightUnit | null | undefined,
  baseVolume: VolumeUnit | null | undefined
): number {
  if (unitType === UnitType.WEIGHT && linkWeight && baseWeight && linkWeight !== baseWeight) {
    return quantity * getWeightConversionFactor(linkWeight, baseWeight);
  }
  if (unitType === UnitType.VOLUME && linkVolume && baseVolume && linkVolume !== baseVolume) {
    return quantity * getVolumeConversionFactor(linkVolume, baseVolume);
  }
  return quantity;
}

/**
 * Returns the weight unit options compatible with the given ingredient unit type.
 * Returns null when the ingredient uses UNIT (no sub-unit options).
 */
export function getCompatibleWeightUnits(unitType: UnitType): WeightUnit[] | null {
  if (unitType !== UnitType.WEIGHT) return null;
  return [WeightUnit.KILOGRAM, WeightUnit.GRAM, WeightUnit.POUND, WeightUnit.OUNCE];
}

export function getCompatibleVolumeUnits(unitType: UnitType): VolumeUnit[] | null {
  if (unitType !== UnitType.VOLUME) return null;
  return [VolumeUnit.LITER, VolumeUnit.MILLILITER, VolumeUnit.GALLON, VolumeUnit.FLUID_OUNCE];
}

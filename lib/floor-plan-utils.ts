import type { TableShapeType, TableStatus, FloorTableStatus } from "@/types/table";
import type { TableWithReservations } from "@/types/tables-client";
import { shapeDefaults } from "@/lib/floor-plan-constants";
export type { TableWithReservations };

// Re-export shapeDefaults for backwards compatibility
export { shapeDefaults };

/**
 * Map Prisma status enum to frontend status type
 */
export const statusMap: Record<string, TableStatus> = {
  EMPTY: "empty",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  CLEANING: "cleaning",
  PAYING: "paying",
};

/**
 * Map frontend DB status to Prisma enum (only covers manually-settable statuses)
 */
export const reverseStatusMap: Record<
  TableStatus,
  "EMPTY" | "OCCUPIED" | "RESERVED" | "CLEANING" | "PAYING"
> = {
  empty: "EMPTY",
  occupied: "OCCUPIED",
  reserved: "RESERVED",
  cleaning: "CLEANING",
  paying: "PAYING",
};

/**
 * FloorTable interface - represents a table in the floor plan UI
 * Position (x, y) represents the CENTER of the table, not top-left
 */
export interface FloorTable {
  id: string;
  number: number;
  x: number; // Center X coordinate
  y: number; // Center Y coordinate
  width: number;
  height: number;
  rotation: number;
  shape: TableShapeType;
  capacity: number;
  status: FloorTableStatus;
  currentGuests: number;
  isShared: boolean;
  hasWaiter?: boolean; // True if any order has an assigned waiter
  waiterName?: string; // Name of the assigned waiter (first one if multiple orders)
  reservationInfo?: {
    customerName: string;
    people: number;
    minutesUntil: number; // negative = overdue
  };
}

/**
 * Calculate table status based on active orders and the DB status field.
 * Priority order:
 *  1. Active orders → "occupied" (or "paying" if DB status is PAYING)
 *  2. DB status "CLEANING" → "cleaning"
 *  3. DB status "RESERVED" → "reserved"
 *  4. DB status "PAYING" (no active orders) → "paying"
 *  5. Default → "empty"
 */
export function calculateTableStatus(dbTable: TableWithReservations): {
  status: FloorTableStatus;
  currentGuests: number;
  hasWaiter: boolean;
  waiterName?: string;
  reservationInfo?: FloorTable["reservationInfo"];
} {
  let status: FloorTableStatus = "empty";
  let currentGuests = 0;
  let hasWaiter = false;
  let waiterName: string | undefined;

  // Priority 1: Active orders (highest priority — customer is already there)
  if (dbTable.orders && dbTable.orders.length > 0) {
    currentGuests = dbTable.orders.reduce(
      (sum, order) => sum + (order.partySize || 0),
      0
    );
    status = dbTable.status === "PAYING" ? "paying" : "occupied";
    const orderWithWaiter = dbTable.orders.find((order) => order.assignedTo);
    if (orderWithWaiter?.assignedTo) {
      hasWaiter = true;
      waiterName = orderWithWaiter.assignedTo.name || undefined;
    }
    return { status, currentGuests, hasWaiter, waiterName };
  }

  // Priority 2–3: Use DB status field (RESERVED is ignored — reservation-per-table no longer used)
  if (dbTable.status === "CLEANING") {
    status = "cleaning";
  } else if (dbTable.status === "PAYING") {
    status = "paying";
  }

  return { status, currentGuests, hasWaiter, waiterName };
}

/**
 * Transform database table to FloorTable format
 * Database stores top-left position, FloorTable uses center position
 */
export function transformTableToFloorTable(
  dbTable: TableWithReservations
): FloorTable {
  const { status, currentGuests, hasWaiter, waiterName, reservationInfo } =
    calculateTableStatus(dbTable);

  const width = dbTable.width ?? 80;
  const height = dbTable.height ?? 80;
  const topLeftX = dbTable.positionX ?? 100;
  const topLeftY = dbTable.positionY ?? 100;

  return {
    id: dbTable.id,
    number: dbTable.number,
    // Convert top-left to center
    x: topLeftX + width / 2,
    y: topLeftY + height / 2,
    width,
    height,
    rotation: dbTable.rotation ?? 0,
    shape: (dbTable.shape ?? "SQUARE") as TableShapeType,
    capacity: dbTable.capacity,
    status,
    currentGuests,
    isShared: dbTable.isShared,
    hasWaiter,
    waiterName,
    reservationInfo,
  };
}

/**
 * Transform array of database tables to FloorTable format
 */
export function transformTables(
  dbTables: TableWithReservations[]
): FloorTable[] {
  return dbTables.map(transformTableToFloorTable);
}

/**
 * Calculate the bounding box of a rotated rectangle
 */
export function getRotatedBounds(
  width: number,
  height: number,
  rotation: number
) {
  const angleRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));

  const boundingWidth = width * cos + height * sin;
  const boundingHeight = width * sin + height * cos;

  return { width: boundingWidth, height: boundingHeight };
}

/**
 * Snap coordinate to grid
 */
export function snapToGrid(value: number, gridSize = 100): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Constrain value to bounds
 */
export function constrainToBounds(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, value));
}

import { getAvailableProductsForOrder } from "@/actions/Order";
import { getOpenCashRegistersForBranch } from "@/actions/CashRegister";
import { requireRole } from "@/lib/permissions/middleware";
import { OrderType, UserRole } from "@/app/generated/prisma";
import { MostradorClient } from "./mostrador-client";

export default async function MostradorPage() {
  const { branchId } = await requireRole(UserRole.WAITER);

  const [products, registers] = await Promise.all([
    getAvailableProductsForOrder(branchId, OrderType.TAKE_AWAY),
    getOpenCashRegistersForBranch(branchId),
  ]);

  return (
    <div className="bg-gray-50 flex flex-col lg:h-svh lg:overflow-hidden no-scrollbar">
      <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:pb-4">
        <MostradorClient
          branchId={branchId}
          initialProducts={products}
          openRegisters={registers.data}
        />
      </div>
    </div>
  );
}

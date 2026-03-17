import type { Metadata } from "next";
import {
  getDeliveryConfig,
  isDeliveryAvailable,
} from "@/actions/DeliveryConfig";

export const metadata: Metadata = {
  title: "Pedidos",
  description: "Realizá tu pedido para delivery o takeaway",
  openGraph: {
    title: "Pedidos",
    description: "Realizá tu pedido para delivery o takeaway",
    images: [
      {
        url: "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg",
      },
    ],
  },
};
import { getProductsForDeliveryMenu } from "@/actions/Order";
import { getRestaurantByBranchId } from "@/actions/Restaurant";
import { OrderType } from "@/app/generated/prisma";
import { getPublicBranchId } from "@/lib/public-branch";
import { notFound } from "next/navigation";
import DeliveryPage from "./components/delivery-page-client";
import DeliveryClosedPage from "./components/delivery-closed-page";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const branchId = await getPublicBranchId();

  if (!branchId) {
    return (
      <div className="min-h-svh bg-white text-neutral-900 flex items-center justify-center p-4">
        <p className="text-red-500">Error: Branch ID no configurado</p>
      </div>
    );
  }

  // Fetch delivery config
  const configResult = await getDeliveryConfig(branchId);

  if (!configResult.success || !configResult.data) {
    notFound();
  }

  const config = configResult.data;

  // Check real-time availability (service active + current time within a window)
  const availability = await isDeliveryAvailable(branchId, new Date());

  if (!availability.available) {
    return (
      <DeliveryClosedPage
        reason={availability.reason}
        windows={config.deliveryWindows}
      />
    );
  }

  const allowDelivery = config.allowDelivery ?? true;
  const allowTakeAway = config.allowTakeAway ?? false;

  // Fetch product sets for each enabled order type.
  // When both are enabled we need both price sets since prices can differ per type.
  let products: Awaited<
    ReturnType<typeof getProductsForDeliveryMenu>
  >["products"] = [];
  let sections: Awaited<
    ReturnType<typeof getProductsForDeliveryMenu>
  >["sections"] = [];
  let takeawayProducts: Awaited<
    ReturnType<typeof getProductsForDeliveryMenu>
  >["products"] = [];
  let takeawaySections: Awaited<
    ReturnType<typeof getProductsForDeliveryMenu>
  >["sections"] = [];

  if (config.menuId) {
    if (allowDelivery && allowTakeAway) {
      // Fetch both price sets in parallel
      const [deliveryResult, takeawayResult] = await Promise.all([
        getProductsForDeliveryMenu(branchId, config.menuId, OrderType.DELIVERY),
        getProductsForDeliveryMenu(
          branchId,
          config.menuId,
          OrderType.TAKE_AWAY,
        ),
      ]);
      products = deliveryResult.products;
      sections = deliveryResult.sections;
      takeawayProducts = takeawayResult.products;
      takeawaySections = takeawayResult.sections;
    } else if (allowTakeAway) {
      const result = await getProductsForDeliveryMenu(
        branchId,
        config.menuId,
        OrderType.TAKE_AWAY,
      );
      products = result.products;
      sections = result.sections;
    } else {
      // Default: delivery only
      const result = await getProductsForDeliveryMenu(
        branchId,
        config.menuId,
        OrderType.DELIVERY,
      );
      products = result.products;
      sections = result.sections;
    }
  }

  const restaurant = await getRestaurantByBranchId(branchId);
  const phoneNumber = restaurant?.whatsappNumber || restaurant?.phone;
  const whatsappUrl = phoneNumber
    ? `https://api.whatsapp.com/send/?phone=${phoneNumber}&app_absent=0`
    : "";

  return (
    <DeliveryPage
      branchId={branchId}
      config={config}
      products={products}
      sections={sections}
      takeawayProducts={takeawayProducts}
      takeawaySections={takeawaySections}
      allowDelivery={allowDelivery}
      allowTakeAway={allowTakeAway}
      restaurantName={restaurant?.name ?? ""}
      whatsappUrl={whatsappUrl}
    />
  );
}

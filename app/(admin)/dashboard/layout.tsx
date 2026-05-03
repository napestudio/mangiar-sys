import { hasBranchPrintersCached } from "@/actions/PrinterActions";
import { getBranchCached } from "@/actions/Branch";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ConditionalGgEzPrintProvider } from "@/components/providers/conditional-gg-ez-print-provider";
import { auth } from "@/lib/auth";
import { getNavItems } from "@/lib/dashboard-nav";
import { getUserRoleAndBranchId } from "@/lib/permissions/roles";
import prisma from "@/lib/prisma";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Mangi.ar - Panel de Administración",
  description:
    "Panel de administración de Mangi.ar para gestionar tu restaurante de manera eficiente",
  // manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-152x152.png", sizes: "152x152", type: "image/png" }],
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single auth check - middleware already verified authentication
  // This check is kept for type safety and to get user data for the nav
  const session = await auth();
  if (!session?.user) {
    redirect("/ingresar");
  }

  // Step 1: get role+branchId in ONE query alongside avatar (no duplicate auth calls)
  const [identityResult, userRecord] = await Promise.all([
    getUserRoleAndBranchId(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    }),
  ]);

  if (!identityResult) {
    redirect("/ingresar");
  }

  const { role: userRole, branchId } = identityResult;

  // Step 2: all three run in parallel now (previously split across two sequential steps)
  const [navItems, hasPrinters, branchResult] = await Promise.all([
    getNavItems(userRole, session.user.id, branchId),
    hasBranchPrintersCached(branchId),
    getBranchCached(branchId),
  ]);

  const printerServerUrl =
    branchResult.success && branchResult.data?.printerServerUrl
      ? branchResult.data.printerServerUrl
      : undefined;
  const restaurantName =
    branchResult.success && branchResult.data?.restaurant?.name
      ? branchResult.data.restaurant.name
      : null;

  return (
    <ConditionalGgEzPrintProvider
      hasPrinters={hasPrinters}
      wsUrl={printerServerUrl}
    >
      <div className="min-h-svh bg-gray-50 w-full">
        <DashboardNav
          userName={session.user.name || session.user.email || ""}
          userRole={userRole}
          navItems={navItems}
          userImage={userRecord?.image ?? null}
          restaurantName={restaurantName}
        />
        <main className="mx-auto">{children}</main>
      </div>
    </ConditionalGgEzPrintProvider>
  );
}

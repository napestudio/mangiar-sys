import { getMenu } from "@/actions/menus";
import { getBranch } from "@/actions/Branch";
import { requireRole } from "@/lib/permissions/middleware";
import { UserRole, PermissionGrant } from "@/app/generated/prisma";
import { notFound } from "next/navigation";
import { MenuEditorClient } from "./components/menu-editor-client";

interface MenuEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MenuEditorPage({ params }: MenuEditorPageProps) {
  const { id } = await params;
  const { branchId } = await requireRole(UserRole.ADMIN, PermissionGrant.MANAGE_MENU);

  const branchResult = await getBranch(branchId);
  const restaurantId =
    branchResult.success && branchResult.data
      ? branchResult.data.restaurantId
      : "";

  if (!restaurantId) {
    notFound();
  }

  // Handle "new" route for creating new menus
  if (id === "new") {
    return <MenuEditorClient menu={null} branchId={branchId} restaurantId={restaurantId} />;
  }

  // Fetch existing menu
  const menu = await getMenu(id);

  if (!menu) {
    notFound();
  }

  return <MenuEditorClient menu={menu} branchId={branchId} restaurantId={restaurantId} />;
}

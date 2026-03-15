import { getMenu } from "@/actions/menus";
import { getCurrentUserBranchId } from "@/lib/user-branch";
import { notFound } from "next/navigation";
import { MenuEditorClient } from "./components/menu-editor-client";

interface MenuEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MenuEditorPage({ params }: MenuEditorPageProps) {
  const { id } = await params;
  const branchId = await getCurrentUserBranchId();

  if (!branchId) {
    notFound();
  }

  // Handle "new" route for creating new menus
  if (id === "new") {
    return <MenuEditorClient menu={null} branchId={branchId} />;
  }

  // Fetch existing menu
  const menu = await getMenu(id);

  if (!menu) {
    notFound();
  }

  return <MenuEditorClient menu={menu} branchId={branchId} />;
}

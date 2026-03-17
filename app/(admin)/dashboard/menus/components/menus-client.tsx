"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedMenu } from "@/actions/menus";
import { MenuRow } from "./menu-row";
import { MenuDialog } from "./menu-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

interface MenusClientProps {
  initialMenus: SerializedMenu[];
  restaurantId: string;
  branchId: string;
}

export function MenusClient({ initialMenus, restaurantId, branchId }: MenusClientProps) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateMenu = () => {
    setIsCreateDialogOpen(true);
  };

  const handleMenuCreated = (newMenu: SerializedMenu) => {
    setMenus((prev) => [newMenu, ...prev]);
    setIsCreateDialogOpen(false);
    router.push(`/dashboard/menus/${newMenu.id}`);
  };

  const handleMenuUpdated = (updatedMenu: SerializedMenu) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === updatedMenu.id ? updatedMenu : m)),
    );
  };

  const handleMenuDeleted = (menuId: string) => {
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={handleCreateMenu}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Menú
        </Button>
      </div>

      {/* Table */}
      {menus.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Secciones</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <MenuRow
                key={menu.id}
                menu={menu}
                editHref={`/dashboard/menus/${menu.id}`}
                onDelete={() => handleMenuDeleted(menu.id)}
                onUpdate={handleMenuUpdated}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay menús creados
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Comienza creando tu primer menú para organizar tus productos
          </p>
          <Button onClick={handleCreateMenu}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primer Menú
          </Button>
        </div>
      )}

      {/* Create Menu Dialog */}
      <MenuDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        menu={null}
        restaurantId={restaurantId}
        branchId={branchId}
        onMenuCreated={handleMenuCreated}
        onMenuUpdated={handleMenuUpdated}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}

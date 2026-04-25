"use client";

import type { SerializedMenu } from "@/actions/menus";
import { deleteMenu, updateMenu } from "@/actions/menus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { SITE_URL } from "@/lib/constants";
import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  QrCode,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCodeLib from "qrcode";
import { useState } from "react";

interface MenuRowProps {
  menu: SerializedMenu;
  editHref: string;
  onDelete: () => void;
  onUpdate: (menu: SerializedMenu) => void;
}

export function MenuRow({ menu, editHref, onDelete, onUpdate }: MenuRowProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMenu(menu.id);
      if (result.success) {
        onDelete();
        toast({ title: "Éxito", description: "Menú eliminado correctamente" });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al eliminar el menú",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el menú",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async () => {
    setIsTogglingActive(true);
    try {
      const result = await updateMenu(menu.id, { isActive: !menu.isActive });
      if (result.success && result.menu) {
        onUpdate({ ...menu, isActive: !menu.isActive });
        toast({
          title: "Éxito",
          description: `Menú ${!menu.isActive ? "activado" : "desactivado"} correctamente`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al actualizar el menú",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar el menú",
      });
    } finally {
      setIsTogglingActive(false);
    }
  };

  const menuUrl = `${SITE_URL}/carta/${menu.slug}`;

  const handleShowQR = async () => {
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      setQrCodeDataUrl(qrDataUrl);
      setIsQRDialogOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar código QR",
      });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(menuUrl, {
        width: 1024,
        margin: 4,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `qr-menu-${menu.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Éxito",
        description: "Código QR descargado correctamente",
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al descargar código QR",
      });
    }
  };

  const sectionCount = menu.menuSections?.length ?? 0;
  const itemCount =
    menu.menuSections?.reduce(
      (acc, section) => acc + (section.menuItems?.length ?? 0),
      0,
    ) ?? 0;

  return (
    <>
      <TableRow className={!menu.isActive ? "opacity-60" : ""}>
        <TableCell>
          <Link href={editHref} className="font-medium hover:underline">
            {menu.name}
          </Link>
        </TableCell>
        <TableCell className="text-muted-foreground">{sectionCount}</TableCell>
        <TableCell className="text-muted-foreground">{itemCount}</TableCell>
        <TableCell>
          {menu.isActive ? (
            <Badge className="bg-green-600 hover:bg-green-500">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              onClick={handleShowQR}
              variant="ghost"
              size="icon"
              title="Ver QR"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Link
              href={`/carta/${menu.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              title="Ver menú"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={editHref}
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleToggleActive}
                  disabled={isTogglingActive}
                >
                  {menu.isActive ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el menú &quot;
              {menu.name}&quot; y todas sus secciones y productos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR del Menú</DialogTitle>
            <DialogDescription>
              Podés descargar QR para el menú &quot;{menu.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeDataUrl && (
              <Image
                src={qrCodeDataUrl}
                alt="QR Code"
                width={256}
                height={256}
                className="w-64 h-64 border border-gray-200 rounded-lg"
              />
            )}
            <div className="text-sm text-gray-600 text-center break-all px-4">
              {menuUrl}
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
              <Link
                href={`/carta/${menu.slug}`}
                target="_blank"
                className={buttonVariants({ variant: "outline" }) + " flex-1"}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Menú
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

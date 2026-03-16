"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { SerializedHomePageLink } from "@/actions/HomePageLinks";
import { LinkDialog } from "./components/link-dialog";
import { SortableLinkList } from "./components/sortable-link-list";
import { reorderHomePageLinks } from "@/actions/HomePageLinks";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

type Menu = {
  id: string;
  name: string;
  slug: string;
};

type TimeSlot = {
  id: string;
  name: string;
};

interface HomePageConfigClientProps {
  branchId: string;
  initialLinks: SerializedHomePageLink[];
  availableMenus: Menu[];
  availableTimeSlots: TimeSlot[];
  restaurantSlug: string | null;
}

export default function HomePageConfigClient({
  branchId,
  initialLinks,
  availableMenus,
  availableTimeSlots,
  restaurantSlug,
}: HomePageConfigClientProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SerializedHomePageLink | null>(
    null,
  );
  const [links, setLinks] = useState<SerializedHomePageLink[]>(initialLinks);

  const handleReorder = (reorderedLinks: SerializedHomePageLink[]) => {
    const previousLinks = links;
    setLinks(reorderedLinks);

    startTransition(async () => {
      const result = await reorderHomePageLinks(
        branchId,
        reorderedLinks.map((l) => l.id),
      );

      if (result.success) {
        toast({
          title: "Orden actualizado",
          description: "El orden de los enlaces se actualizó correctamente",
        });
      } else {
        toast({
          title: "Error al reordenar",
          description: result.error || "Error al actualizar orden",
          variant: "destructive",
        });
        // Revert on error
        setLinks(previousLinks);
      }
    });
  };

  const handleLinkCreated = (newLink: SerializedHomePageLink) => {
    // Optimistically add the new link
    setLinks((prev) => [...prev, newLink]);
  };

  const handleLinkUpdated = (updatedLink: SerializedHomePageLink) => {
    // Optimistically update the link
    setLinks((prev) =>
      prev.map((link) => (link.id === updatedLink.id ? updatedLink : link)),
    );
  };

  const handleLinkDeleted = (deletedId: string) => {
    // Optimistically remove the link
    setLinks((prev) => prev.filter((link) => link.id !== deletedId));
  };

  const openEditDialog = (link: SerializedHomePageLink) => {
    setEditingLink(link);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingLink(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración de Página Principal
          </h1>
          <p className="mt-2 text-gray-600">
            Configura los enlaces que aparecen en la página de inicio del
            restaurante.
          </p>
        </div>
        {restaurantSlug && (
          <Link
            href={(() => {
              const base = new URL(SITE_URL);
              return `${base.protocol}//${restaurantSlug}.${base.host}`;
            })()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="shrink-0 gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver página de inicio
            </Button>
          </Link>
        )}
      </div>

      {/* Links Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enlaces de Inicio</CardTitle>
              <CardDescription>
                Agrega, edita o reordena los enlaces que verán los clientes.
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              Agregar Enlace
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No hay enlaces configurados.</p>
              <p className="text-sm">
                Agrega enlaces para que los clientes puedan navegar desde la
                página de inicio.
              </p>
            </div>
          ) : (
            <SortableLinkList
              links={links}
              onReorder={handleReorder}
              onEdit={openEditDialog}
              onLinkUpdated={handleLinkUpdated}
              onLinkDeleted={handleLinkDeleted}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <LinkDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        branchId={branchId}
        editingLink={editingLink}
        availableMenus={availableMenus}
        availableTimeSlots={availableTimeSlots}
        onLinkCreated={handleLinkCreated}
        onLinkUpdated={handleLinkUpdated}
      />
    </div>
  );
}

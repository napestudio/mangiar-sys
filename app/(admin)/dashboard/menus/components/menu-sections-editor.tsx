"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { SerializedMenu, SerializedMenuSection } from "@/actions/menus";
import {
  createMenuSection,
  updateMenuSection,
  deleteMenuSection,
  reorderMenuSections,
} from "@/actions/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { SectionContentManager } from "./section-content-manager";

interface MenuSectionsEditorProps {
  menu: SerializedMenu;
  restaurantId: string;
  onUpdate: () => void;
}

export function MenuSectionsEditor({
  menu,
  restaurantId,
  onUpdate,
}: MenuSectionsEditorProps) {
  const { toast } = useToast();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(new Set());

  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");

  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionDescription, setEditSectionDescription] = useState("");

  const [sections, setSections] = useState(menu.menuSections || []);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(
      (menu.menuSections || []).map((s) => [
        s.id,
        (s.menuItems?.length ?? 0) +
          (s.menuItemGroups?.reduce((sum, g) => sum + (g.menuItems?.length ?? 0), 0) ?? 0),
      ]),
    ),
  );
  const isOptimisticRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOptimisticRef.current) {
      isOptimisticRef.current = false;
      return;
    }
    setSections(menu.menuSections || []);
  }, [menu]);

  // ─── Add section — optimistic ────────────────────────────────────────────
  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre de la sección es obligatorio" });
      return;
    }

    const sectionName = newSectionName.trim();
    const sectionDescription = newSectionDescription.trim() || undefined;

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticSection: SerializedMenuSection = {
      id: tempId,
      menuId: menu.id,
      name: sectionName,
      description: sectionDescription ?? null,
      order: sections.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      menuItems: [],
      menuItemGroups: [],
    };

    const previousSections = sections;
    isOptimisticRef.current = true;
    setSections((prev) => [...prev, optimisticSection]);
    setNewSectionName("");
    setNewSectionDescription("");
    setIsAddingSection(false);

    const result = await createMenuSection({
      menuId: menu.id,
      name: sectionName,
      description: sectionDescription,
      order: previousSections.length,
    });

    if (result.success && result.section) {
      const realSection: SerializedMenuSection = {
        id: result.section.id,
        menuId: result.section.menuId,
        name: result.section.name,
        description: result.section.description ?? null,
        order: result.section.order,
        createdAt: String(result.section.createdAt),
        updatedAt: String(result.section.updatedAt),
        menuItems: [],
        menuItemGroups: [],
      };
      isOptimisticRef.current = true;
      setSections((prev) =>
        prev.map((s) => (s.id === tempId ? realSection : s)),
      );
    } else {
      isOptimisticRef.current = false;
      setSections(previousSections);
      toast({ variant: "destructive", title: "Error", description: result.error || "Error al crear la sección" });
    }
  };

  const handleStartEdit = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      setEditSectionName(section.name);
      setEditSectionDescription(section.description || "");
      setEditingSectionId(sectionId);
    }
  };

  // ─── Edit section — optimistic ───────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingSectionId || !editSectionName.trim()) return;

    const sectionId = editingSectionId;
    const newName = editSectionName.trim();
    const newDescription = editSectionDescription.trim() || null;

    const previousSections = sections;
    isOptimisticRef.current = true;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, name: newName, description: newDescription } : s,
      ),
    );
    setEditingSectionId(null);

    const result = await updateMenuSection(sectionId, {
      name: newName,
      description: newDescription || undefined,
    });

    if (!result.success) {
      isOptimisticRef.current = true;
      setSections(previousSections);
      setEditingSectionId(sectionId);
      setEditSectionName(newName);
      setEditSectionDescription(newDescription || "");
      toast({ variant: "destructive", title: "Error", description: result.error || "Error al actualizar la sección" });
    }
    // No onUpdate() — local state is correct
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditSectionName("");
    setEditSectionDescription("");
  };

  // ─── Delete section — already optimistic ─────────────────────────────────
  const handleDeleteSection = () => {
    if (!deletingSectionId) return;

    const sectionIdToDelete = deletingSectionId;
    const previousSections = sections;

    isOptimisticRef.current = true;
    setSections((prev) => prev.filter((s) => s.id !== sectionIdToDelete));
    setDeletingSectionId(null);

    startTransition(async () => {
      const result = await deleteMenuSection(sectionIdToDelete);
      if (!result.success) {
        isOptimisticRef.current = true;
        setSections(previousSections);
        toast({ variant: "destructive", title: "Error", description: result.error || "Error al eliminar la sección" });
      }
      // No onUpdate()
    });
  };

  const handleToggleSection = (sectionId: string) => {
    setCollapsedSectionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionExpanded = (sectionId: string) => !collapsedSectionIds.has(sectionId);

  // ─── Move up/down — already updates local state, no onUpdate() needed ───
  const handleMoveUp = (sectionId: string) => {
    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (currentIndex <= 0) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[currentIndex - 1]] = [
      newSections[currentIndex - 1],
      newSections[currentIndex],
    ];

    const updates = newSections.map((section, index) => ({ id: section.id, order: index }));

    isOptimisticRef.current = true;
    setSections(newSections); // Optimistic

    reorderMenuSections(updates).then((result) => {
      if (!result.success) {
        isOptimisticRef.current = true;
        setSections(sections); // Revert
        toast({ variant: "destructive", title: "Error", description: "Error al reordenar secciones" });
      }
      // No onUpdate()
    });
  };

  const handleMoveDown = (sectionId: string) => {
    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (currentIndex >= sections.length - 1) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[currentIndex + 1]] = [
      newSections[currentIndex + 1],
      newSections[currentIndex],
    ];

    const updates = newSections.map((section, index) => ({ id: section.id, order: index }));

    isOptimisticRef.current = true;
    setSections(newSections); // Optimistic

    reorderMenuSections(updates).then((result) => {
      if (!result.success) {
        isOptimisticRef.current = true;
        setSections(sections); // Revert
        toast({ variant: "destructive", title: "Error", description: "Error al reordenar secciones" });
      }
      // No onUpdate()
    });
  };

  const itemCountCallbacks = useMemo(
    () =>
      Object.fromEntries(
        sections.map((s) => [
          s.id,
          (count: number) =>
            setItemCounts((prev) => ({ ...prev, [s.id]: count })),
        ]),
      ),
    [sections],
  );

  return (
    <div className="space-y-4">
      {sections.length === 0 && !isAddingSection && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">
            No hay secciones en este menú. Haz clic en &quot;Agregar Nueva
            Sección&quot; para comenzar.
          </p>
        </div>
      )}

      {sections.map((section, index) => (
        <Card key={section.id} className={section.id.startsWith("temp-") ? "opacity-70" : ""}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveUp(section.id)}
                  disabled={index === 0 || section.id.startsWith("temp-")}
                  title="Mover arriba"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveDown(section.id)}
                  disabled={index === sections.length - 1 || section.id.startsWith("temp-")}
                  title="Mover abajo"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                {editingSectionId === section.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editSectionName}
                      onChange={(e) => setEditSectionName(e.target.value)}
                      placeholder="Nombre de la sección"
                    />
                    <Textarea
                      value={editSectionDescription}
                      onChange={(e) => setEditSectionDescription(e.target.value)}
                      placeholder="Descripción (opcional)"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="mr-1 h-3 w-3" />
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="mr-1 h-3 w-3" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-base">{section.name}</CardTitle>
                    {section.description && (
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {itemCounts[section.id] ?? section.menuItems?.length ?? 0} producto
                      {(itemCounts[section.id] ?? section.menuItems?.length ?? 0) !== 1 ? "s" : ""}
                    </div>
                  </>
                )}
              </div>

              {editingSectionId !== section.id && !section.id.startsWith("temp-") && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleStartEdit(section.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => setDeletingSectionId(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {editingSectionId !== section.id && (
            <CardContent>
              {isSectionExpanded(section.id) && !section.id.startsWith("temp-") && (
                <SectionContentManager
                  section={section}
                  restaurantId={restaurantId}
                  onUpdate={onUpdate}
                  onItemCountChanged={itemCountCallbacks[section.id]}
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleSection(section.id)}
                className="w-full text-gray-600 mt-4"
                disabled={section.id.startsWith("temp-")}
              >
                {isSectionExpanded(section.id) ? "Ocultar Contenido" : "Mostrar Contenido"}
              </Button>
            </CardContent>
          )}
        </Card>
      ))}

      {!isAddingSection && (
        <Button
          onClick={() => setIsAddingSection(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Agregar Nueva Sección
        </Button>
      )}

      {/* Add New Section Form */}
      {isAddingSection && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-base text-blue-900">Nueva Sección del Menú</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Nombre de la Sección *</Label>
              <Input
                id="sectionName"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="ej. Entradas, Platos Principales, Postres"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Descripción (opcional)</Label>
              <Textarea
                id="sectionDescription"
                value={newSectionDescription}
                onChange={(e) => setNewSectionDescription(e.target.value)}
                placeholder="Agrega una descripción para esta sección"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddSection} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Crear Sección
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingSection(false);
                  setNewSectionName("");
                  setNewSectionDescription("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSectionId}
        onOpenChange={() => setDeletingSectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la sección y todos los productos asociados.
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
};

export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: Props) {
  const [reason, setReason] = useState("");

  function handleOpenChange(value: boolean) {
    if (!value) setReason("");
    onOpenChange(value);
  }

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar orden</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El motivo quedará registrado junto
            con la fecha y el usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            Motivo de cancelación <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Ej: Cliente se retiró, error en el pedido..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Cancelando..." : "Cancelar orden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

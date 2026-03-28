"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign } from "lucide-react";
import { addGlobalMovement } from "@/actions/CashRegister";
import {
  PAYMENT_METHODS,
  MOVEMENT_TYPE_LABELS,
  GLOBAL_MOVEMENT_CATEGORIES,
} from "@/types/cash-register";
import type { GlobalMovement } from "@/types/cash-register";

const OTHER_CATEGORY = "Otra";

export interface OptimisticGlobalMovement extends GlobalMovement {
  isOptimistic: true;
}

interface AddGlobalMovementDialogProps {
  onMovementAdded?: (movement: OptimisticGlobalMovement) => void;
  onMovementFailed?: (tempId: string) => void;
  onMovementConfirmed?: (
    tempId: string,
    realMovement: OptimisticGlobalMovement,
  ) => void;
}

export function AddGlobalMovementDialog({
  onMovementAdded,
  onMovementFailed,
  onMovementConfirmed,
}: AddGlobalMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const effectiveCategory =
    category === OTHER_CATEGORY ? customCategory.trim() : category;

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }

    if (category === OTHER_CATEGORY && !customCategory.trim()) {
      setError("Ingresá el nombre de la categoría");
      return;
    }

    const capturedType = type;
    const capturedPaymentMethod = paymentMethod;
    const capturedCategory = effectiveCategory || null;
    const capturedDescription = description.trim();

    const tempId = crypto.randomUUID();
    const optimisticMovement: OptimisticGlobalMovement = {
      id: tempId,
      type: capturedType,
      paymentMethod: capturedPaymentMethod as GlobalMovement["paymentMethod"],
      amount: parsedAmount,
      description: capturedDescription || null,
      category: capturedCategory,
      createdAt: new Date().toISOString(),
      createdBy: "",
      createdByName: "Vos",
      isOptimistic: true,
    };

    onMovementAdded?.(optimisticMovement);
    resetForm();
    setOpen(false);

    try {
      const result = await addGlobalMovement({
        type: capturedType,
        paymentMethod: capturedPaymentMethod as
          | "CASH"
          | "CARD_DEBIT"
          | "CARD_CREDIT"
          | "ACCOUNT"
          | "TRANSFER"
          | "PAYMENT_LINK"
          | "QR_CODE",
        amount: parsedAmount,
        description: capturedDescription || undefined,
        category: capturedCategory || undefined,
      });

      if (result.success && result.data) {
        const real = result.data as unknown as {
          id: string;
          createdAt: string;
          createdBy: string;
        };
        onMovementConfirmed?.(tempId, {
          ...optimisticMovement,
          id: real.id,
          createdAt: real.createdAt,
          createdBy: real.createdBy,
        });
      } else {
        onMovementFailed?.(tempId);
      }
    } catch {
      onMovementFailed?.(tempId);
    }
  };

  const resetForm = () => {
    setAmount("");
    setType("EXPENSE");
    setPaymentMethod("CASH");
    setCategory("");
    setCustomCategory("");
    setDescription("");
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    setOpen(isOpen);
  };

  const isSubmitDisabled =
    !amount || (category === OTHER_CATEGORY && !customCategory.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo movimiento global
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento Global</DialogTitle>
          <DialogDescription>
            Registrá un ingreso o egreso que no está vinculado a ningún arqueo
            de caja, como pagos a proveedores, servicios o gastos operativos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="global-movement-amount">Monto *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <NumberInput
                id="global-movement-amount"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="global-movement-type">Tipo *</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as "INCOME" | "EXPENSE")}
            >
              <SelectTrigger id="global-movement-type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">
                  {MOVEMENT_TYPE_LABELS.EXPENSE}
                </SelectItem>
                <SelectItem value="INCOME">
                  {MOVEMENT_TYPE_LABELS.INCOME}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="global-movement-category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="global-movement-category">
                <SelectValue placeholder="Seleccionar categoría (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {GLOBAL_MOVEMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_CATEGORY}>Otra...</SelectItem>
              </SelectContent>
            </Select>
            {category === OTHER_CATEGORY && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ingresá la categoría"
              />
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="global-movement-payment">Medio de Pago *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="global-movement-payment">
                <SelectValue placeholder="Seleccionar medio de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="global-movement-description">
              Descripción (opcional)
            </Label>
            <Textarea
              id="global-movement-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Factura proveedor Juan García, servicio de gas..."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
            disabled={isSubmitDisabled}
          >
            Registrar movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

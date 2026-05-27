"use client";

import { updateClosedOrderPayment, type PaymentEntry } from "@/actions/Order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS } from "@/types/cash-register";
import { type PaymentMethodExtended } from "@/actions/Order";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface PaymentLine {
  id: string;
  method: PaymentMethodExtended;
  amount: string;
}

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderTotal: number;
  currentPayments: Array<{ paymentMethod: string; amount: number }>;
  onSuccess: () => void;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  currentPayments,
  onSuccess,
}: EditPaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentLine[]>([]);

  // Initialize payments from currentPayments when dialog opens
  useEffect(() => {
    if (!open) return;
    if (currentPayments && currentPayments.length > 0) {
      setPayments(
        currentPayments.map((m, i) => ({
          id: String(i + 1),
          method: m.paymentMethod as PaymentMethodExtended,
          amount: m.amount.toFixed(2),
        })),
      );
    } else {
      setPayments([
        { id: "1", method: "CASH", amount: orderTotal.toFixed(2) },
      ]);
    }
    setError(null);
  }, [open, currentPayments, orderTotal]);

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [payments],
  );

  const remainder = orderTotal - totalPaid;
  const change = Math.max(0, -remainder);
  const isSplit = payments.length > 1;

  const addPaymentLine = () => {
    const rem = Math.max(0, orderTotal - totalPaid);
    const newId = Date.now().toString();
    setPayments((prev) => [
      ...prev,
      { id: newId, method: "CASH", amount: rem.toFixed(2) },
    ]);
  };

  const removePaymentLine = (id: string) => {
    setPayments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  };

  const updatePaymentLine = (
    id: string,
    field: "method" | "amount",
    value: string,
  ) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleConfirm = async () => {
    setError(null);

    const validPayments: PaymentEntry[] = payments
      .filter((p) => parseFloat(p.amount) > 0)
      .map((p) => ({
        method: p.method,
        amount: parseFloat(p.amount),
      }));

    if (validPayments.length === 0) {
      setError("Ingresá al menos un monto de pago");
      return;
    }

    if (remainder > 0.01) {
      setError(
        `El monto pagado (${formatCurrency(totalPaid)}) es menor al total (${formatCurrency(orderTotal)})`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateClosedOrderPayment({
        orderId,
        newPayments: validPayments,
      });

      if (result.success) {
        toast({ title: "Método de pago actualizado" });
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error || "Error al actualizar el pago");
      }
    } catch {
      setError("Error al actualizar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar método de pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order total (read-only) */}
          <div className="flex justify-between items-center px-1 text-sm font-medium">
            <span className="text-muted-foreground">Total de la orden:</span>
            <span className="text-lg font-semibold">
              {formatCurrency(orderTotal)}
            </span>
          </div>

          {/* Payment lines */}
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3">
                <select
                  value={payment.method}
                  onChange={(e) =>
                    updatePaymentLine(
                      payment.id,
                      "method",
                      e.target.value as PaymentMethodExtended,
                    )
                  }
                  disabled={isLoading}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <CurrencyInput
                    value={payment.amount}
                    onChange={(e) =>
                      updatePaymentLine(payment.id, "amount", e.target.value)
                    }
                    placeholder="0,00"
                    className="pl-7"
                    disabled={isLoading}
                  />
                </div>

                {payments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => removePaymentLine(payment.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add payment line */}
          <Button
            variant="outline"
            size="sm"
            onClick={addPaymentLine}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Dividir pago
          </Button>

          {/* Remainder / Change indicator */}
          {isSplit && (
            <div>
              {remainder > 0.01 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                  <span className="text-red-800 font-medium text-sm">
                    Restante:
                  </span>
                  <span className="text-lg font-bold text-red-700">
                    {formatCurrency(remainder)}
                  </span>
                </div>
              ) : change > 0.01 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                  <span className="text-blue-800 font-medium text-sm">
                    Vuelto:
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(change)}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                  Cubierto
                </div>
              )}
            </div>
          )}

          {/* Warning about closed sessions */}
          <p className="text-xs text-muted-foreground">
            Los movimientos de caja asociados a esta orden serán reemplazados
            por los nuevos métodos de pago. Si la sesión ya fue cerrada, el
            resumen de cierre no se recalcula automáticamente.
          </p>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Confirmar cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

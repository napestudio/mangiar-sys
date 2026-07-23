"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Loader2,
  Check,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Link,
  QrCode,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { PaymentMethod } from "@/app/generated/prisma";
import { CartItemRow } from "./cart-item-row";
import type { CartItem } from "@/types/mostrador";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: PaymentMethod.CASH,
    label: "Efectivo",
    icon: <Banknote className="h-4 w-4" />,
  },
  {
    value: PaymentMethod.CARD,
    label: "Tarjeta",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    value: PaymentMethod.TRANSFER,
    label: "Transferencia",
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  {
    value: PaymentMethod.QR_CODE,
    label: "QR",
    icon: <QrCode className="h-4 w-4" />,
  },
  {
    value: PaymentMethod.PAYMENT_LINK,
    label: "Link de pago",
    icon: <Link className="h-4 w-4" />,
  },
];

interface CartPanelProps {
  cart: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onUpdateItem: (cartId: string, updated: CartItem) => void;
  onRemoveItem: (cartId: string) => void;
  onConfirmOrder: () => void;
  onCancelOrder: () => void;
  orderConfirmed: boolean;
  isSubmitting: boolean;
}

export function CartPanel({
  cart,
  total,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateItem,
  onRemoveItem,
  onConfirmOrder,
  onCancelOrder,
  orderConfirmed,
  isSubmitting,
}: CartPanelProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successLeaving, setSuccessLeaving] = useState(false);

  useEffect(() => {
    if (orderConfirmed) {
      setSuccessVisible(true);
      setSuccessLeaving(false);
    } else if (successVisible) {
      setSuccessLeaving(true);
      const t = setTimeout(() => {
        setSuccessVisible(false);
        setSuccessLeaving(false);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [orderConfirmed, successVisible]);

  const selectedOption =
    PAYMENT_OPTIONS.find((o) => o.value === paymentMethod) ??
    PAYMENT_OPTIONS[0];

  return (
    <div className="rounded-xl border bg-white shadow-sm flex flex-col h-full relative overflow-hidden">
      <style>{`
        @keyframes circle-expand {
          from { clip-path: circle(0% at 50% 50%); }
          to   { clip-path: circle(150% at 50% 50%); }
        }
        @keyframes circle-collapse {
          from { clip-path: circle(150% at 50% 50%); }
          to   { clip-path: circle(0% at 50% 50%); }
        }
      `}</style>

      {successVisible && (
        <div
          className="absolute inset-0 z-20 rounded-xl bg-green-500 flex flex-col items-center justify-center gap-4"
          style={{
            animation: successLeaving
              ? "circle-collapse 0.5s ease-in forwards"
              : "circle-expand 0.5s ease-out forwards",
          }}
        >
          <Check className="h-16 w-16 text-white" strokeWidth={2.5} />
          <p className="text-xl font-bold text-white">¡Venta confirmada!</p>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg">Pedido</h2>
        {cart.length > 0 && (
          <Badge variant="secondary">Productos {cart.length}</Badge>
        )}
      </div>


      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
            <ShoppingBag className="h-10 w-10" />
            <p className="text-sm">Agregá productos para comenzar</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItemRow
              key={item.cartId}
              item={item}
              onUpdate={(updated) => onUpdateItem(item.cartId, updated)}
              onRemove={() => onRemoveItem(item.cartId)}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Método de pago
            </p>
            <button
              onClick={() => setPaymentDialogOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border bg-gray-900 text-white border-gray-900 text-sm font-medium transition-colors hover:bg-gray-800"
            >
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            <Dialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
            >
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Método de pago</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onPaymentMethodChange(opt.value);
                        setPaymentDialogOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border text-sm font-medium transition-colors",
                        paymentMethod === opt.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400",
                      )}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            size="lg"
            className="w-full min-h-13 bg-red-700 hover:bg-red-800 text-base font-bold"
            onClick={onConfirmOrder}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar pedido
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-500"
            onClick={() => setCancelDialogOpen(true)}
            disabled={isSubmitting}
          >
            Cancelar pedido
          </Button>

          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="max-w-xs">
              <DialogHeader>
                <DialogTitle>¿Cancelar pedido?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500">
                Se eliminarán todos los productos del pedido actual.
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Volver
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onCancelOrder();
                    setCancelDialogOpen(false);
                  }}
                >
                  Cancelar pedido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

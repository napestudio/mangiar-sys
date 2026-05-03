"use client";

import {
  ShoppingBag,
  Loader2,
  Check,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Link,
  QrCode,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { PaymentMethod } from "@/app/generated/prisma";
import { CartItemRow } from "./cart-item-row";
import type { CartItem } from "@/types/mostrador";

type OpenRegister = {
  id: string;
  name: string;
  sectors: { id: string; name: string; color: string | null }[];
  session: { id: string; openedAt: string; openingAmount: number } | null;
};

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
  isSubmitting: boolean;
  openRegisters: OpenRegister[];
  selectedSessionId: string | null;
  onSessionChange: (sessionId: string | null) => void;
}

export function CartPanel({
  cart,
  total,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateItem,
  onRemoveItem,
  onConfirmOrder,
  isSubmitting,
  openRegisters,
  selectedSessionId,
  onSessionChange,
}: CartPanelProps) {
  const registersWithSession = openRegisters.filter((r) => r.session);

  return (
    <div className="rounded-xl border bg-white shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg">Pedido</h2>
        {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 text-sm">
        <Store className="h-4 w-4 text-gray-400 shrink-0" />
        {registersWithSession.length === 0 ? (
          <span className="text-gray-400">Sin caja abierta — venta sin arqueo</span>
        ) : registersWithSession.length === 1 ? (
          <span className="text-gray-600">{registersWithSession[0].name}</span>
        ) : (
          <Select
            value={selectedSessionId ?? ""}
            onValueChange={(val) => onSessionChange(val || null)}
          >
            <SelectTrigger className="h-7 text-sm border-0 bg-transparent shadow-none p-0 focus:ring-0">
              <SelectValue placeholder="Seleccionar caja" />
            </SelectTrigger>
            <SelectContent>
              {registersWithSession.map((r) => (
                <SelectItem key={r.session!.id} value={r.session!.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onPaymentMethodChange(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors min-h-14",
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
          </div>

          <Button
            size="lg"
            className="w-full min-h-13 text-base font-bold"
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
        </div>
      )}
    </div>
  );
}

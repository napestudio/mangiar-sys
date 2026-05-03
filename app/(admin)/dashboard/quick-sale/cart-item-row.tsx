"use client";

import { useState } from "react";
import { Minus, Plus, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";
import type { CartItem } from "@/types/mostrador";

interface CartItemRowProps {
  item: CartItem;
  onUpdate: (updated: CartItem) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onUpdate, onRemove }: CartItemRowProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  const handleNotesOpen = () => {
    setTempNotes(item.notes ?? "");
    setEditingNotes(true);
  };

  const handleNotesSave = () => {
    onUpdate({ ...item, notes: tempNotes || undefined });
    setEditingNotes(false);
    setTempNotes("");
  };

  const handleNotesCancel = () => {
    setEditingNotes(false);
    setTempNotes("");
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{item.itemName}</p>
          {item.modifiers && item.modifiers.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {item.modifiers
                .map((m) =>
                  m.quantity && m.quantity > 1
                    ? `${m.quantity}x ${m.optionName}`
                    : m.optionName,
                )
                .join(", ")}
            </p>
          )}
          {item.notes && !editingNotes && (
            <p className="text-xs text-gray-500 italic mt-0.5">{item.notes}</p>
          )}
          <p className="text-sm font-semibold mt-1">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
            aria-label="Eliminar item"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdate({ ...item, quantity: Math.max(1, item.quantity - 1) })}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdate({ ...item, quantity: item.quantity + 1 })}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-700"
            onClick={handleNotesOpen}
            aria-label="Agregar nota"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {editingNotes && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={tempNotes}
            onChange={(e) => setTempNotes(e.target.value)}
            placeholder="Notas especiales (ej: sin cebolla, extra salsa...)"
            className="text-sm resize-none h-16"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleNotesSave();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleNotesCancel();
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNotesSave} className="flex-1">
              Guardar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNotesCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

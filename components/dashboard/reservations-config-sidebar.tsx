"use client";

import { useState } from "react";
import { Settings, Bell, X } from "lucide-react";
import { updateBranch } from "@/actions/Branch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReservationsConfigSidebarProps {
  branchId: string;
  initialEmail: string | null;
}

export default function ReservationsConfigSidebar({
  branchId,
  initialEmail,
}: ReservationsConfigSidebarProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const result = await updateBranch(branchId, { notificationEmail: email });

    if (result.success) {
      setMessage({
        type: "success",
        text: "Email de notificación actualizado correctamente.",
      });
    } else {
      setMessage({ type: "error", text: result.error || "Error al guardar." });
    }

    setLoading(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="bg-red-500 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notificaciones</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-red-600"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-900">Email de reservas</h3>
            <p className="text-sm text-gray-500">
              Las nuevas reservas web se enviarán a este correo electrónico.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-email">Email</Label>
              <Input
                id="notification-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@restaurante.com"
              />
            </div>

            {message && (
              <p
                className={cn(
                  "text-sm",
                  message.type === "success" ? "text-green-600" : "text-red-600"
                )}
              >
                {message.text}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { sendTestReservationEmails } from "@/actions/debug-emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Config {
  hasApiKey: boolean;
  hasEmailFrom: boolean;
  hasMonitorEmail: boolean;
  emailFrom: string;
  monitorEmail: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TestResult {
  restaurant?: EmailResult;
  customer?: EmailResult;
}

function ConfigBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`font-mono text-xs px-2 py-0.5 rounded ${
          ok
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className="font-mono text-gray-700">{label}</span>
      <span className={ok ? "text-green-700" : "text-red-600"}>
        {ok ? "Configurado" : "Faltante"}
      </span>
    </div>
  );
}

function ResultRow({ label, result }: { label: string; result?: EmailResult }) {
  if (!result) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 font-mono text-xs px-2 py-0.5 rounded shrink-0 ${
          result.success
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {result.success ? "✓" : "✗"}
      </span>
      <div>
        <span className="font-medium text-gray-800">{label}</span>
        {result.success && result.messageId && (
          <p className="text-gray-500 font-mono text-xs mt-0.5">
            ID: {result.messageId}
          </p>
        )}
        {!result.success && result.error && (
          <p className="text-red-600 text-xs mt-0.5">{result.error}</p>
        )}
      </div>
    </div>
  );
}

export function DebugEmailsClient({ config }: { config: Config }) {
  const [restaurantEmail, setRestaurantEmail] = useState(config.monitorEmail);
  const [customerEmail, setCustomerEmail] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    setResult(null);
    setError(null);
    startTransition(async () => {
      const res = await sendTestReservationEmails({
        restaurantEmail,
        customerEmail,
      });
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    });
  };

  const configOk = config.hasApiKey && config.hasEmailFrom;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Debug: Email Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Solo visible para SUPERADMIN. Envía emails de prueba usando la
          configuración actual de Resend.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Configuración
        </h2>
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <ConfigBadge label="RESEND_API_KEY" ok={config.hasApiKey} />
          <ConfigBadge label="EMAIL_FROM" ok={config.hasEmailFrom} />
          <ConfigBadge
            label="RESEND_INTERNAL_MONITOR"
            ok={config.hasMonitorEmail}
          />
          {config.hasEmailFrom && (
            <p className="text-xs text-gray-500 pt-1">
              Emails enviados desde:{" "}
              <span className="font-mono">{config.emailFrom}</span>
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Prueba de emails de reserva
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="restaurant-email">
              Email destino — notificación restaurante
            </Label>
            <Input
              id="restaurant-email"
              type="email"
              placeholder="restaurante@ejemplo.com"
              value={restaurantEmail}
              onChange={(e) => setRestaurantEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-email">
              Email destino — confirmación cliente
            </Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="cliente@ejemplo.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={isPending || !configOk || !customerEmail}
        >
          {isPending ? "Enviando..." : "Enviar emails de prueba"}
        </Button>

        {!configOk && (
          <p className="text-xs text-red-600">
            Faltan variables de entorno requeridas (RESEND_API_KEY, EMAIL_FROM).
          </p>
        )}
      </section>

      {(result || error) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Resultado
          </h2>
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <ResultRow label="Notificación al restaurante" result={result?.restaurant} />
            <ResultRow label="Confirmación al cliente" result={result?.customer} />
          </div>
        </section>
      )}
    </div>
  );
}

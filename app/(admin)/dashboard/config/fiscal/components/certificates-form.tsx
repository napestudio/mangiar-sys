"use client";

import { useState, useEffect } from "react";
import {
  FiscalConfigInput,
  FiscalConfigData,
  updateFiscalConfig,
} from "@/actions/FiscalConfig";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface CertificatesFormProps {
  initialConfig: FiscalConfigData | null;
  restaurantId: string;
}

function validatePem(content: string, type: "certificate" | "key"): boolean {
  if (!content.trim()) return true; // Empty is ok (optional)
  if (type === "certificate") {
    return content.includes("-----BEGIN CERTIFICATE-----");
  }
  return (
    content.includes("-----BEGIN PRIVATE KEY-----") ||
    content.includes("-----BEGIN RSA PRIVATE KEY-----")
  );
}

export function CertificatesForm({
  initialConfig,
  restaurantId,
}: CertificatesFormProps) {
  const { toast } = useToast();

  const hasSavedCert = !!initialConfig?.certificateContent;
  const hasSavedKey = !!initialConfig?.privateKeyContent;

  // Start in "display saved" mode if certs are already configured
  const [replacingCert, setReplacingCert] = useState(!hasSavedCert);
  const [replacingKey, setReplacingKey] = useState(!hasSavedKey);

  const [formData, setFormData] = useState<Partial<FiscalConfigInput>>({
    environment: initialConfig?.environment ?? "test",
    // Don't pre-fill content — user must explicitly choose to replace
    certificateContent: initialConfig?.certificateContent ?? "",
    privateKeyContent: initialConfig?.privateKeyContent ?? "",
    // Include required fields with defaults
    isEnabled: initialConfig?.isEnabled ?? false,
    businessName: initialConfig?.businessName ?? "",
    cuit: initialConfig?.cuit ?? "",
    defaultPtoVta: initialConfig?.defaultPtoVta ?? 1,
    defaultInvoiceType: initialConfig?.defaultInvoiceType ?? 6,
    autoIssue: initialConfig?.autoIssue ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state when initialConfig changes (triggered by revalidatePath after any tab saves)
  useEffect(() => {
    setFormData({
      environment: initialConfig?.environment ?? "test",
      certificateContent: initialConfig?.certificateContent ?? "",
      privateKeyContent: initialConfig?.privateKeyContent ?? "",
      isEnabled: initialConfig?.isEnabled ?? false,
      businessName: initialConfig?.businessName ?? "",
      cuit: initialConfig?.cuit ?? "",
      defaultPtoVta: initialConfig?.defaultPtoVta ?? 1,
      defaultInvoiceType: initialConfig?.defaultInvoiceType ?? 6,
      autoIssue: initialConfig?.autoIssue ?? false,
    });
    // After a save, if certs now exist, exit replace mode
    setReplacingCert(!initialConfig?.certificateContent);
    setReplacingKey(!initialConfig?.privateKeyContent);
  }, [initialConfig]);

  const newCertContent = replacingCert ? (formData.certificateContent || "") : "";
  const newKeyContent = replacingKey ? (formData.privateKeyContent || "") : "";

  const certValid = validatePem(newCertContent, "certificate");
  const keyValid = validatePem(newKeyContent, "key");
  const certHasContent = !!newCertContent.trim();
  const keyHasContent = !!newKeyContent.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (replacingCert && certHasContent && !certValid) {
      toast({
        title: "Certificado inválido",
        description: "El certificado debe estar en formato PEM (-----BEGIN CERTIFICATE-----)",
        variant: "destructive",
      });
      return;
    }

    if (replacingKey && keyHasContent && !keyValid) {
      toast({
        title: "Clave privada inválida",
        description: "La clave privada debe estar en formato PEM (-----BEGIN PRIVATE KEY-----)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // If not replacing, keep the existing saved content
    const dataToSave: Partial<FiscalConfigInput> = {
      ...formData,
      certificateContent: replacingCert
        ? formData.certificateContent
        : initialConfig?.certificateContent ?? "",
      privateKeyContent: replacingKey
        ? formData.privateKeyContent
        : initialConfig?.privateKeyContent ?? "",
    };

    const result = await updateFiscalConfig(
      restaurantId,
      dataToSave as FiscalConfigInput,
    );

    if (result.success) {
      toast({
        title: "Configuración guardada",
        description: "Los certificados se actualizaron correctamente",
      });
      // Reset replace mode after save
      if (replacingCert && certHasContent) setReplacingCert(false);
      if (replacingKey && keyHasContent) setReplacingKey(false);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      {/* Security notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">
            Importante: Seguridad de certificados
          </p>
          <p className="text-amber-800 mt-1">
            El contenido de los certificados se almacena de forma segura en la
            base de datos y nunca se expone al cliente. Solo pega el contenido
            completo en formato PEM (incluyendo las líneas{" "}
            <code className="bg-amber-100 px-1 rounded">-----BEGIN...-----</code>).
          </p>
        </div>
      </div>

      {/* Environment Selection */}
      <div>
        <Label htmlFor="environment">Ambiente ARCA</Label>
        <Select
          value={formData.environment}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              environment: value as "test" | "production",
            })
          }
        >
          <SelectTrigger id="environment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Prueba / Homologación</SelectItem>
            <SelectItem value="production">Producción</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.environment === "production"
            ? "⚠️ Usará certificados de producción de ARCA"
            : "Usará certificados de prueba de ARCA"}
        </p>
      </div>

      {/* Certificate Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="certificateContent">
            Certificado digital (.crt) — Contenido PEM
          </Label>
          {!replacingCert && certHasContent && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" /> Guardado
            </span>
          )}
          {replacingCert && certHasContent && (
            certValid
              ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Formato válido</span>
              : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Formato inválido</span>
          )}
        </div>

        {hasSavedCert && !replacingCert ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-800 flex-1">Certificado configurado</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplacingCert(true);
                setFormData({ ...formData, certificateContent: "" });
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reemplazar
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              id="certificateContent"
              value={formData.certificateContent || ""}
              onChange={(e) =>
                setFormData({ ...formData, certificateContent: e.target.value })
              }
              placeholder={`-----BEGIN CERTIFICATE-----\nMIID...contenido del certificado...\n-----END CERTIFICATE-----`}
              className="font-mono text-xs h-40"
            />
            {hasSavedCert && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 text-xs text-gray-500"
                onClick={() => {
                  setReplacingCert(false);
                  setFormData({ ...formData, certificateContent: initialConfig?.certificateContent ?? "" });
                }}
              >
                Cancelar reemplazo
              </Button>
            )}
          </>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Pega el contenido completo del archivo .crt o .pem, incluyendo las líneas BEGIN/END
        </p>
      </div>

      {/* Private Key Content */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="privateKeyContent">
            Clave privada (.key) — Contenido PEM
          </Label>
          {!replacingKey && keyHasContent && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" /> Guardado
            </span>
          )}
          {replacingKey && keyHasContent && (
            keyValid
              ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Formato válido</span>
              : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Formato inválido</span>
          )}
        </div>

        {hasSavedKey && !replacingKey ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-800 flex-1">Clave privada configurada</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplacingKey(true);
                setFormData({ ...formData, privateKeyContent: "" });
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reemplazar
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              id="privateKeyContent"
              value={formData.privateKeyContent || ""}
              onChange={(e) =>
                setFormData({ ...formData, privateKeyContent: e.target.value })
              }
              placeholder={`-----BEGIN PRIVATE KEY-----\nMIIE...contenido de la clave privada...\n-----END PRIVATE KEY-----`}
              className="font-mono text-xs h-40"
            />
            {hasSavedKey && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 text-xs text-gray-500"
                onClick={() => {
                  setReplacingKey(false);
                  setFormData({ ...formData, privateKeyContent: initialConfig?.privateKeyContent ?? "" });
                }}
              >
                Cancelar reemplazo
              </Button>
            )}
          </>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Pega el contenido completo del archivo .key o .pem de la clave privada
        </p>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold">Cómo obtener los certificados ARCA:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Accede a la web de ARCA con tu CUIT</li>
          <li>Ve a &quot;Administrador de Relaciones de Clave Fiscal&quot;</li>
          <li>
            Genera un Certificado Digital para &quot;Facturación
            Electrónica&quot;
          </li>
          <li>
            Descarga el certificado (.crt) — abre el archivo con un editor de texto y copia todo el contenido aquí arriba
          </li>
          <li>
            Guarda la clave privada (.key) que generaste — abre el archivo y copia todo el contenido en el campo de clave privada
          </li>
        </ol>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar certificados"}
        </Button>
      </div>
    </form>
  );
}

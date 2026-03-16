"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { step1Schema } from "@/lib/validations/registro";
import type { Step1Data } from "@/lib/validations/registro";

export type SlugState = {
  slug: string;
  available: boolean | null;
};

type Step1Props = {
  defaultValues: Step1Data;
  slugState: SlugState;
  onNext: (data: Step1Data) => void;
};

export function Step1({ defaultValues, slugState, onNext }: Step1Props) {
  const [values, setValues] = useState<Step1Data>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  function update<K extends keyof Step1Data>(key: K, value: Step1Data[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleNext() {
    const result = step1Schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Step1Data, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof Step1Data;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (slugState.slug.length >= 2 && !slugState.available) {
      setErrors((prev) => ({
        ...prev,
        businessName: "Este nombre ya está en uso, probá con otro",
      }));
      return;
    }

    onNext(result.data);
  }

  const isSlugChecking =
    slugState.slug.length >= 2 && slugState.available === null;

  return (
    <div className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">
          Nombre del negocio <span className="text-red-600">*</span>
        </Label>
        <Input
          id="businessName"
          value={values.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          placeholder="Ej: La Parrilla de Juan"
          aria-invalid={!!errors.businessName}
        />

        {/* Live slug preview */}
        {slugState.slug.length >= 2 && (
          <div className="flex items-center gap-2 text-sm">
            {slugState.available === null && (
              <>
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Verificando disponibilidad…</span>
              </>
            )}
            {slugState.available === true && (
              <>
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                <span className="text-muted-foreground">
                  Tu acceso será:{" "}
                  <strong className="text-foreground">
                    admin@{slugState.slug}.com
                  </strong>
                </span>
              </>
            )}
            {slugState.available === false && (
              <>
                <XCircle className="size-4 shrink-0 text-red-600" />
                <span className="text-red-600">
                  &ldquo;{slugState.slug}&rdquo; ya está en uso
                </span>
              </>
            )}
          </div>
        )}

        {errors.businessName && (
          <p className="text-sm text-red-600">{errors.businessName}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Teléfono de la persona encargada <span className="text-red-600">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="flex items-center px-3 border border-input rounded-md bg-muted text-sm text-muted-foreground select-none whitespace-nowrap">
            🇦🇷 +54
          </div>
          <Input
            id="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="9 11 2345-6789"
            className="flex-1"
            aria-invalid={!!errors.phone}
          />
        </div>
        <p className="text-xs text-muted-foreground">Ejemplo: 9 11 2345-6789</p>
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Contact email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail">
          E-mail de contacto <span className="text-red-600">*</span>
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={values.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          placeholder="nombre@gmail.com"
          aria-invalid={!!errors.contactEmail}
        />
        <p className="text-xs text-muted-foreground">Ejemplo: nombre@gmail.com</p>
        {errors.contactEmail && (
          <p className="text-sm text-red-600">{errors.contactEmail}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña para tu cuenta <span className="text-red-600">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="pr-10"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Debe contener mínimo 8 caracteres, mayúsculas, minúsculas y un número.
        </p>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <Button
        type="button"
        onClick={handleNext}
        disabled={isSlugChecking}
        className="w-full"
      >
        Continuar
      </Button>
    </div>
  );
}

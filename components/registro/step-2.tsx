"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { step2Schema } from "@/lib/validations/registro";
import type { Step2Data } from "@/lib/validations/registro";
import { RESTAURANT_TYPE_LABELS } from "@/lib/sample-data";

type Step2Props = {
  defaultValues: Step2Data;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (data: Step2Data) => void;
};

export function Step2({ defaultValues, isPending, onBack, onSubmit }: Step2Props) {
  const [values, setValues] = useState<Step2Data>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});

  function update<K extends keyof Step2Data>(key: K, value: Step2Data[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit() {
    const result = step2Schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Step2Data, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof Step2Data;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(result.data);
  }

  return (
    <div className="space-y-6">
      {/* Person name */}
      <div className="space-y-2">
        <Label htmlFor="personName">
          Nombre y apellido de la persona encargada{" "}
          <span className="text-red-600">*</span>
        </Label>
        <Input
          id="personName"
          value={values.personName}
          onChange={(e) => update("personName", e.target.value)}
          placeholder="Ej: Juan García"
          aria-invalid={!!errors.personName}
        />
        {errors.personName && (
          <p className="text-sm text-red-600">{errors.personName}</p>
        )}
      </div>

      {/* Restaurant type */}
      <div className="space-y-2">
        <Label htmlFor="restaurantType">
          Tipo de negocio <span className="text-red-600">*</span>
        </Label>
        <Select
          value={values.restaurantType}
          onValueChange={(v) =>
            update("restaurantType", v as Step2Data["restaurantType"])
          }
        >
          <SelectTrigger
            id="restaurantType"
            className="w-full"
            aria-invalid={!!errors.restaurantType}
          >
            <SelectValue placeholder="Elegí una opción" />
          </SelectTrigger>
          <SelectContent>
            {RESTAURANT_TYPE_LABELS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.restaurantType && (
          <p className="text-sm text-red-600">{errors.restaurantType}</p>
        )}
      </div>

      {/* Promo code */}
      <div className="space-y-2">
        <Label htmlFor="promoCode">
          Código promocional{" "}
          <span className="text-muted-foreground font-normal text-sm">
            (opcional)
          </span>
        </Label>
        <Input
          id="promoCode"
          value={values.promoCode ?? ""}
          onChange={(e) => update("promoCode", e.target.value)}
          placeholder="Si tenés un código, ingresalo aquí"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="flex-1"
        >
          Volver
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Creando tu cuenta…
            </span>
          ) : (
            "Crear cuenta gratis"
          )}
        </Button>
      </div>
    </div>
  );
}

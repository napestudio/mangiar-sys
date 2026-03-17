"use client";

import { updateRestaurantTheme } from "@/actions/Restaurant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  ButtonShape,
  ButtonVariant,
  FontFamily,
  RestaurantTheme,
} from "@/types/restaurant-theme";
import { useTransition } from "react";
import { useState } from "react";

interface AppearanceConfigClientProps {
  restaurantId: string;
  initialTheme: RestaurantTheme;
}

const BUTTON_SHAPES: { value: ButtonShape; label: string; preview: string }[] =
  [
    { value: "pill", label: "Pill", preview: "rounded-full" },
    { value: "rounded", label: "Redondeado", preview: "rounded-md" },
    { value: "sharp", label: "Cuadrado", preview: "rounded-none" },
  ];

const BUTTON_VARIANTS: { value: ButtonVariant; label: string }[] = [
  { value: "outline", label: "Contorno" },
  { value: "solid", label: "Sólido" },
];

const FONT_FAMILIES: {
  value: FontFamily;
  label: string;
  style: React.CSSProperties;
}[] = [
  {
    value: "geist",
    label: "Geist Sans",
    style: { fontFamily: "var(--font-geist-sans), sans-serif" },
  },
  {
    value: "poppins",
    label: "Poppins",
    style: { fontFamily: "var(--font-poppins), sans-serif" },
  },
  {
    value: "serif",
    label: "Serif",
    style: { fontFamily: "Georgia, 'Times New Roman', serif" },
  },
];

const SHAPE_RADIUS: Record<ButtonShape, string> = {
  pill: "9999px",
  rounded: "8px",
  sharp: "0px",
};

export default function AppearanceConfigClient({
  restaurantId,
  initialTheme,
}: AppearanceConfigClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<RestaurantTheme>(initialTheme);

  function update<K extends keyof RestaurantTheme>(
    key: K,
    value: RestaurantTheme[K],
  ) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateRestaurantTheme(restaurantId, theme);
      if (result.success) {
        toast({ title: "Diseño guardado", description: result.message });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  const previewBtnStyle: React.CSSProperties = {
    borderRadius: SHAPE_RADIUS[theme.buttonShape],
    backgroundColor:
      theme.buttonVariant === "solid"
        ? theme.primaryColor
        : theme.backgroundColor,
    color:
      theme.buttonVariant === "solid"
        ? theme.backgroundColor
        : theme.primaryColor,
    border: `2px solid ${theme.primaryColor}`,
    fontFamily:
      theme.fontFamily === "geist"
        ? "var(--font-geist-sans), sans-serif"
        : theme.fontFamily === "poppins"
          ? "var(--font-poppins), sans-serif"
          : "Georgia, 'Times New Roman', serif",
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
          <CardDescription>
            Define la paleta de colores de tu página principal
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ColorField
            label="Color principal"
            description="Botones, íconos y acentos"
            value={theme.primaryColor}
            onChange={(v) => update("primaryColor", v)}
          />
          <ColorField
            label="Color de fondo"
            description="Fondo de la página"
            value={theme.backgroundColor}
            onChange={(v) => update("backgroundColor", v)}
          />
          <ColorField
            label="Color de texto"
            description="Títulos y cuerpo"
            value={theme.textColor}
            onChange={(v) => update("textColor", v)}
          />
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Botones</CardTitle>
          <CardDescription>
            Estilo de los botones en la página principal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shape */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Forma</p>
            <div className="flex gap-3 flex-wrap">
              {BUTTON_SHAPES.map(({ value, label, preview }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("buttonShape", value)}
                  className={cn(
                    "px-5 py-2 border-2 font-semibold text-sm transition-colors",
                    preview,
                    theme.buttonShape === value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-500",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Variante</p>
            <div className="flex gap-3">
              {BUTTON_VARIANTS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("buttonVariant", value)}
                  className={cn(
                    "px-5 py-2 rounded border-2 font-semibold text-sm transition-colors",
                    theme.buttonVariant === value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-500",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografía</CardTitle>
          <CardDescription>
            Fuente utilizada en la página principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {FONT_FAMILIES.map(({ value, label, style }) => (
              <button
                key={value}
                type="button"
                onClick={() => update("fontFamily", value)}
                className={cn(
                  "px-5 py-3 rounded border-2 text-base transition-colors",
                  theme.fontFamily === value
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 text-gray-600 hover:border-gray-500",
                )}
                style={style}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>
            Así se verán los botones en tu página principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg p-8 flex flex-col items-center gap-4"
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <p
              className="text-2xl font-bold"
              style={{
                color: theme.textColor,
                fontFamily: previewBtnStyle.fontFamily,
              }}
            >
              Mi Restaurante
            </p>
            {["Ver Menú", "Reservar Mesa", "Hacer un Pedido"].map((label) => (
              <div
                key={label}
                className="w-full max-w-sm py-2 text-center font-bold uppercase text-sm"
                style={previewBtnStyle}
              >
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">{label}</label>
      <p className="text-xs text-gray-500">{description}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-gray-300"
        />
        <span className="text-sm font-mono text-gray-600 uppercase">
          {value}
        </span>
      </div>
    </div>
  );
}

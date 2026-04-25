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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    { value: "pill", label: "Pildora", preview: "rounded-full" },
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
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            description="Títulos y cuerpo de la página"
            value={theme.textColor}
            onChange={(v) => update("textColor", v)}
          />
          <ColorField
            label="Color de tarjeta"
            description="Fondo de las secciones del menú"
            value={theme.cardColor}
            onChange={(v) => update("cardColor", v)}
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
            Así se verá tu página principal con los colores y estilos elegidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="botones">
            <TabsList className="mb-4">
              <TabsTrigger value="botones">Página principal</TabsTrigger>
              <TabsTrigger value="menu">Menú</TabsTrigger>
            </TabsList>

            <TabsContent value="botones">
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
            </TabsContent>

            <TabsContent value="menu">
              <MenuPreview theme={theme} fontFamily={previewBtnStyle.fontFamily as string} />
            </TabsContent>
          </Tabs>
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

function cardTextColor(cardHex: string): string {
  const r = parseInt(cardHex.slice(1, 3), 16) / 255;
  const g = parseInt(cardHex.slice(3, 5), 16) / 255;
  const b = parseInt(cardHex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.179 ? "#171717" : "#f5f5f5";
}

interface PreviewItem { name: string; description?: string; price: string }
interface PreviewSection { name: string; description?: string; items: PreviewItem[] }

const PREVIEW_SECTIONS: PreviewSection[] = [
  {
    name: "Entradas",
    description: "Para comenzar",
    items: [
      { name: "Empanadas", description: "Al horno, masa casera", price: "$1.500" },
      { name: "Tabla de fiambres", description: "Selección de la casa", price: "$3.200" },
    ],
  },
  {
    name: "Platos principales",
    items: [
      { name: "Milanesa napolitana", description: "Con papas fritas", price: "$4.800" },
      { name: "Lomo al champignon", price: "$5.500" },
    ],
  },
];

function MenuPreview({ theme, fontFamily }: { theme: RestaurantTheme; fontFamily: string }) {
  const cardText = cardTextColor(theme.cardColor);
  const cardMuted = `color-mix(in srgb, ${cardText} 55%, transparent)`;

  return (
    <div
      className="rounded-lg p-6 space-y-4"
      style={{ backgroundColor: theme.backgroundColor, fontFamily }}
    >
      <div className="text-center space-y-1 mb-6">
        <p className="text-2xl font-bold" style={{ color: theme.textColor }}>Carta</p>
        <p className="text-sm" style={{ color: `color-mix(in srgb, ${theme.textColor} 55%, transparent)` }}>
          Descubrí nuestros platos
        </p>
      </div>

      {PREVIEW_SECTIONS.map((section) => (
        <div
          key={section.name}
          className="rounded-xl p-4 space-y-3"
          style={{ background: theme.cardColor }}
        >
          <div>
            <p className="font-bold text-lg" style={{ color: cardText }}>{section.name}</p>
            {section.description && (
              <p className="text-xs" style={{ color: cardMuted }}>{section.description}</p>
            )}
          </div>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.name}>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm flex-1" style={{ color: cardText }}>
                    {item.name}
                  </span>
                  <div className="flex-1 h-px self-center" style={{ background: cardText, opacity: 0.2 }} />
                  <span className="font-bold text-sm shrink-0" style={{ color: cardText }}>
                    {item.price}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs mt-0.5" style={{ color: cardMuted }}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
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

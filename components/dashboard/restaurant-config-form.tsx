"use client";

import { updateRestaurant, type RestaurantUpdateInput } from "@/actions/Restaurant";
import { saveBusinessHours, type BusinessHoursPeriodData } from "@/actions/business-hours";
import { deleteProductImage } from "@/actions/Products";
import ProvinceCitySelect from "@/components/ui/province-city-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  tiktokUrl: string | null;
  whatsappNumber: string | null;
};

type RestaurantConfigFormProps = {
  restaurant: Restaurant;
  initialPeriods: BusinessHoursPeriodData[];
};

// ── Business Hours helpers ─────────────────────────────────────────────────

const DAYS = [
  { value: "monday",    short: "Lun" },
  { value: "tuesday",   short: "Mar" },
  { value: "wednesday", short: "Mié" },
  { value: "thursday",  short: "Jue" },
  { value: "friday",    short: "Vie" },
  { value: "saturday",  short: "Sáb" },
  { value: "sunday",    short: "Dom" },
] as const;

type DayValue = (typeof DAYS)[number]["value"];

type Slot = {
  _key: string;
  days: DayValue[];
  openTime: string;
  closeTime: string;
  label: string;
};

function groupPeriodsIntoSlots(periods: BusinessHoursPeriodData[]): Slot[] {
  const map = new Map<string, Slot>();
  for (const p of periods) {
    const key = `${p.openTime}|${p.closeTime}|${p.label ?? ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        _key: p.id,
        days: [p.dayOfWeek as DayValue],
        openTime: p.openTime,
        closeTime: p.closeTime,
        label: p.label ?? "",
      });
    } else {
      existing.days.push(p.dayOfWeek as DayValue);
    }
  }
  return Array.from(map.values());
}

function slotsToPeriodsInput(slots: Slot[]) {
  return slots.flatMap((slot, slotIdx) =>
    slot.days.map((day) => ({
      dayOfWeek: day,
      openTime: slot.openTime,
      closeTime: slot.closeTime,
      label: slot.label || undefined,
      order: slotIdx,
    })),
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RestaurantConfigForm({
  restaurant,
  initialPeriods,
}: RestaurantConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<RestaurantUpdateInput>({
    name: restaurant.name,
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    logoUrl: restaurant.logoUrl || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    state: restaurant.state || "",
    postalCode: restaurant.postalCode || "",
    country: restaurant.country || "Argentina",
    websiteUrl: restaurant.websiteUrl || "",
    facebookUrl: restaurant.facebookUrl || "",
    instagramUrl: restaurant.instagramUrl || "",
    twitterUrl: restaurant.twitterUrl || "",
    linkedinUrl: restaurant.linkedinUrl || "",
    tiktokUrl: restaurant.tiktokUrl || "",
    whatsappNumber: restaurant.whatsappNumber || "",
  });

  const [originalLogoUrl] = useState(restaurant.logoUrl || "");

  const [slots, setSlots] = useState<Slot[]>(() =>
    groupPeriodsIntoSlots(initialPeriods),
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (originalLogoUrl && originalLogoUrl !== formData.logoUrl) {
      deleteProductImage(originalLogoUrl);
    }

    const [restaurantResult, hoursResult] = await Promise.all([
      updateRestaurant(restaurant.id, formData),
      saveBusinessHours(restaurant.id, slotsToPeriodsInput(slots)),
    ]);

    if (!restaurantResult.success) {
      setError(restaurantResult.error || "Error al actualizar el restaurante");
    } else if (!hoursResult.success) {
      setError(hoursResult.error || "Error al guardar los horarios");
    } else {
      setSuccess("Configuración guardada exitosamente");
      // Sync slot keys with new DB ids by re-grouping
      setSlots(groupPeriodsIntoSlots(hoursResult.data));
    }

    setIsSubmitting(false);
  };

  // ── Slot helpers ──────────────────────────────────────────────────────────

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        days: [],
        openTime: "09:00",
        closeTime: "17:00",
        label: "",
      },
    ]);
  };

  const removeSlot = (_key: string) => {
    setSlots((prev) => prev.filter((s) => s._key !== _key));
  };

  const updateSlot = (_key: string, field: keyof Omit<Slot, "_key" | "days">, value: string) => {
    setSlots((prev) =>
      prev.map((s) => (s._key === _key ? { ...s, [field]: value } : s)),
    );
  };

  const toggleDay = (_key: string, day: DayValue) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s._key !== _key) return s;
        const days = s.days.includes(day)
          ? s.days.filter((d) => d !== day)
          : [...s.days, day];
        return { ...s, days };
      }),
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Información Básica */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Información Básica
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Restaurante *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Breve descripción de tu restaurante"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <ImageUpload
              value={formData.logoUrl ?? ""}
              onChange={(url) => setFormData((prev) => ({ ...prev, logoUrl: url }))}
              onRemove={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="+54 11 1234-5678"
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProvinceCitySelect
            province={formData.state ?? ""}
            city={formData.city ?? ""}
            onProvinceChange={(value) =>
              setFormData((prev) => ({ ...prev, state: value }))
            }
            onCityChange={(value) =>
              setFormData((prev) => ({ ...prev, city: value }))
            }
            disabled={isSubmitting}
          />
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Av. Corrientes 1234"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="C1043"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Argentina"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Redes Sociales</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="https://www.turestaurante.com"
            />
          </div>
          <div>
            <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Facebook
            </label>
            <input
              type="url"
              id="facebookUrl"
              name="facebookUrl"
              value={formData.facebookUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="https://www.facebook.com/turestaurante"
            />
          </div>
          <div>
            <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              type="url"
              id="instagramUrl"
              name="instagramUrl"
              value={formData.instagramUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="https://www.instagram.com/turestaurante"
            />
          </div>
          <div>
            <label htmlFor="tiktokUrl" className="block text-sm font-medium text-gray-700 mb-1">
              TikTok
            </label>
            <input
              type="url"
              id="tiktokUrl"
              name="tiktokUrl"
              value={formData.tiktokUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="https://www.tiktok.com/@turestaurante"
            />
          </div>
          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              id="whatsappNumber"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="5491112345678"
            />
            <p className="text-xs text-gray-500 mt-1">
              Código de país + número, sin espacios ni símbolos. Ej: 5491112345678
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Si este número también está siendo usado para notificaciones de pedidos, deberás actualizarlo manualmente en la configuración de pedidos.
            </p>
          </div>
        </div>
      </div>

      {/* Horarios de Atención */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Horarios de Atención</h3>
          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <Plus className="size-4" />
            Agregar turno
          </button>
        </div>

        {slots.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No hay turnos configurados. Hacé clic en &quot;Agregar turno&quot; para empezar.
          </p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot._key}
                className="flex flex-wrap items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                {/* Day toggles */}
                <div className="flex flex-wrap gap-1">
                  {DAYS.map(({ value, short }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(slot._key, value)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                        slot.days.includes(value)
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {short}
                    </button>
                  ))}
                </div>

                <span className="text-gray-300 hidden sm:block">|</span>

                {/* Time range */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={slot.openTime}
                    onChange={(e) => updateSlot(slot._key, "openTime", e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="time"
                    value={slot.closeTime}
                    onChange={(e) => updateSlot(slot._key, "closeTime", e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Label */}
                <input
                  type="text"
                  value={slot.label}
                  onChange={(e) => updateSlot(slot._key, "label", e.target.value)}
                  placeholder="Ej: Almuerzo"
                  maxLength={40}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 w-32"
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeSlot(slot._key)}
                  className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Eliminar turno"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-3">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}

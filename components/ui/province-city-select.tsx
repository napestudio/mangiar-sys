"use client";

import {
  ARGENTINA_PROVINCES,
  getMunicipalitiesByProvince,
} from "@/lib/geo/argentina";

interface ProvinceCitySelectProps {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
}

const SELECT_CLASS =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed";

export default function ProvinceCitySelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  disabled = false,
}: ProvinceCitySelectProps) {
  const selectedProvince = ARGENTINA_PROVINCES.find(
    (p) => p.nombre === province,
  );
  const municipalities = selectedProvince
    ? getMunicipalitiesByProvince(selectedProvince.id)
    : [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onProvinceChange(e.target.value);
    onCityChange("");
  };

  return (
    <>
      <div>
        <label
          htmlFor="state"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Provincia
        </label>
        <select
          id="state"
          name="state"
          value={province}
          onChange={handleProvinceChange}
          disabled={disabled}
          className={SELECT_CLASS}
        >
          <option value="">Seleccioná una provincia</option>
          {ARGENTINA_PROVINCES.map((p) => (
            <option key={p.id} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Ciudad
        </label>
        <select
          id="city"
          name="city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled || !province}
          className={SELECT_CLASS}
        >
          <option value="">
            {province ? "Seleccioná una ciudad" : "Primero elegí una provincia"}
          </option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.nombre}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

import { CheckCircle } from "lucide-react";
import Link from "next/link";

const features = [
  "Carta digital con fotos y categorías",
  "Página pública del restaurante",
  "Reservas online",
  "Ventas y comandas",
  "Delivery y pedidos para llevar",
  "Gestión de mesas y salón",
  "Facturación y cierre de caja",
  "Reportes y estadísticas",
  "Acceso por roles (mozo, cajero, cocina)",
];

export function Pricing() {
  return (
    <section id="precios" className="font-sans bg-white py-24 px-6 lg:px-28">
      <div className="mx-auto">
        <div className="mb-16 space-y-4">
          <div className="inline-block py-4 bg-white rounded-full leading-none px-5 shadow-md text-sm font-semibold uppercase text-red">
            Precios
          </div>
          <h2 className="text-[clamp(1.875rem,3vw,3.5rem)] leading-none font-semibold tracking-tight text-black">
            Un plan. <span className="italic font-serif">Todo incluido.</span>
          </h2>
          <p className="text-[clamp(1rem,1.1vw,1.25rem)] text-gray-600 font-light max-w-2xl">
            Sin niveles, sin sorpresas, sin funcionalidades escondidas detrás de
            un precio más alto. Todo lo que necesitás desde el primer día.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          {/* Left: plan info */}
          <div className="bg-red p-10 flex flex-col justify-between gap-8">
            <div className="space-y-2">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">
                Plan único
              </p>
              <p className="text-white text-5xl font-bold leading-none">
                A consultar
              </p>
              <p className="text-white/60 text-sm">por mes · sin permanencia</p>
            </div>
            <p className="text-white/80 text-base leading-relaxed">
              Activá tu restaurante hoy y empezá a gestionar todo desde un mismo
              lugar. Precios accesibles para negocios de todos los tamaños.
            </p>
            <Link
              href="/registro"
              className="inline-block text-center rounded-full px-8 py-3.5 text-sm font-semibold bg-white text-red transition-transform hover:scale-105"
            >
              Empezar ahora
            </Link>
          </div>

          {/* Right: features */}
          <div className="bg-[#f9f9f9] p-10 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
              Incluye todo esto
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const stats = [
  { value: "+500", label: "Negocios activos" },
  { value: "+10.000", label: "Reservas gestionadas" },
  { value: "+50.000", label: "Comandas procesadas" },
];

const testimonials = [
  {
    quote:
      "Desde que usamos Mangi.ar, organizamos las reservas sin esfuerzo y reducimos los errores en cocina a casi cero.",
    name: "Lucía Ferrante",
    restaurant: "La Trattoria, Buenos Aires",
  },
  {
    quote:
      "La carta digital fue un antes y un después. Nuestros clientes la aman y nosotros actualizamos los precios en segundos.",
    name: "Marcos Giménez",
    restaurant: "El Parrillón, Rosario",
  },
  {
    quote:
      "Arrancamos gratis y en dos semanas ya estábamos tomando pedidos online. Muy fácil de configurar.",
    name: "Sofía Almada",
    restaurant: "Heladería Nonna, Córdoba",
  },
];

export function TrustedBy() {
  return (
    <section id="confianza" className="font-sans bg-[#f9f9f9] py-24 px-6 lg:px-28">
      <div className="mx-auto">
        <div className="mb-16 space-y-4">
          <div className="inline-block py-4 bg-white rounded-full leading-none px-5 shadow-md text-sm font-semibold uppercase text-red">
            Confianza
          </div>
          <h2 className="text-[clamp(1.875rem,3vw,3.5rem)] leading-none font-semibold tracking-tight text-black">
            Restaurantes que ya{" "}
            <span className="italic font-serif">confían en nosotros</span>
          </h2>
          <p className="text-[clamp(1rem,1.1vw,1.25rem)] text-gray-600 font-light max-w-2xl">
            De cafeterías a parrillas, de heladerías a restaurantes de autor.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-md p-8 text-center"
            >
              <p className="text-5xl font-bold text-red leading-none mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-xl shadow-md p-6 space-y-4 flex flex-col"
            >
              <p className="text-gray-700 text-sm leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="font-semibold text-sm text-black">{t.name}</p>
                <p className="text-xs text-gray-400">{t.restaurant}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

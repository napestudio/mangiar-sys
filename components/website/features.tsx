"use client";

import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const features = [
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558369/reservas_rc0pcc.jpg",
    title: "Reservas",
    description:
      "Gestioná reservas online y presenciales con confirmaciones automáticas y gestión de turnos.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/qr_isjdv4.jpg",
    title: "Carta Digital QR",
    description:
      "Creá tus cartas digitales QR con fotos, descripciones y precios actualizados en tiempo real.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/messas_dgnci0.jpg",
    title: "Gestión de Mesas",
    description:
      "Visualizá el salón, asigná mesas y controlá el estado de cada sector en tiempo real.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558369/ventas_cssloa.jpg",
    title: "Ventas y Comandas",
    description:
      "Tomá pedidos desde la mesa, la barra o el mostrador. Comandas directas a cocina.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/delivery_gm3dmi.jpg",
    title: "Delivery y Takeaway",
    description: "Administrá pedidos a domicilio y para llevar.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/facturacion_osk1dy.jpg",
    title: "Facturación",
    description:
      "Generá facturas y tickets con un clic. Control de caja y cierre diario integrado.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/linkinbio_gqte0p.jpg",
    title: "Página del restaurante",
    description:
      "Cada restaurante tiene su propia landing pública: carta, info, galería y reservas. Tu link-in-bio gastronómico.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558368/estadisticas_ok9bf5.jpg",
    title: "Reportes",
    description:
      "Estadísticas de ventas, productos más pedidos y rendimiento por período.",
  },
  {
    icon: "https://res.cloudinary.com/dztzomvin/image/upload/v1777558369/usuarios_i4osjk.jpg",
    title: "Acceso por roles",
    description:
      "Asigná permisos por rol: administrador, mozo, cajero o cocinero. Cada uno ve solo lo que necesita.",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const headerTl = gsap
        .timeline({ paused: true })
        .from(headerRef.current!.children, { y: 30, opacity: 0, stagger: 0.12 });

      ScrollTrigger.create({
        animation: headerTl,
        trigger: headerRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      });

      const cardsTl = gsap
        .timeline({ paused: true })
        .from(gridRef.current!.children, { y: 40, opacity: 0, stagger: 0.07 });

      ScrollTrigger.create({
        animation: cardsTl,
        trigger: gridRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      });

      const ctaTl = gsap
        .timeline({ paused: true })
        .from(ctaRef.current, { y: 24, opacity: 0 });

      ScrollTrigger.create({
        animation: ctaTl,
        trigger: ctaRef.current,
        start: "top 90%",
        toggleActions: "play none none none",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="funcionalidades"
      className="font-sans bg-neutral-50 py-24 px-6 lg:px-28"
    >
      <div className="mx-auto">
        <div ref={headerRef} className="mb-16 space-y-4">
          <div className="inline-block py-4 bg-white rounded-full leading-none px-5 shadow-md text-sm font-semibold uppercase text-red">
            Funcionalidades
          </div>
          <h2 className="text-[clamp(1.875rem,3vw,3.5rem)] leading-none font-semibold tracking-tight text-black">
            Todo lo que necesitás en{" "}
            <span className="italic font-serif">un solo lugar</span>
          </h2>
          <p className="text-[clamp(1rem,1.1vw,1.25rem)] text-gray-600 font-light max-w-2xl">
            Una plataforma pensada para el día a día del gastrónomo. Sin
            complicaciones, sin apps extra.
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            return (
              <div
                key={feature.title}
                className="bg-white rounded-xl shadow-md p-6 space-y-3 hover:shadow-lg transition-shadow"
              >
                <Image
                  src={feature.icon}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white "
                  height={200}
                  width={200}
                  alt=""
                />

                <h3 className="font-semibold text-base text-black">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div ref={ctaRef} className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-6 font-light">
            ¿Listo para llevar tu negocio al siguiente nivel?
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 group rounded-full bg-red text-white px-8 py-3.5 font-semibold text-base transition-transform hover:scale-105 duration-300"
          >
            Comenzá a gestionar hoy
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
}

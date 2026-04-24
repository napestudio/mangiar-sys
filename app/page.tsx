import Logo from "@/components/dashboard/logo";
import { Navbar } from "@/components/home/navbar";
import RestaurantLandingPage from "@/components/landing/restaurant-landing";
import { Features } from "@/components/website/features";
import { Footer } from "@/components/website/footer";
import { Pricing } from "@/components/website/pricing";
import { TrustedBy } from "@/components/website/trusted-by";
import { getPublicRestaurantAndBranch } from "@/lib/public-branch";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = (await headers()).get("x-subdomain");

  if (!subdomain) {
    return {
      title: "Mangi.ar — Sistema de Gestión para Restaurantes",
      description:
        "La plataforma integral que gestiona reservas, ventas, delivery y facturación.",
    };
  }

  const publicData = await getPublicRestaurantAndBranch();
  if (!publicData) return { title: "Restaurante" };

  const { restaurant } = publicData;

  const locationParts = [restaurant.city, restaurant.state].filter(Boolean);
  const location = locationParts.join(", ");
  const description =
    restaurant.description ??
    (location
      ? `${restaurant.name} — ${location}`
      : `Visitá ${restaurant.name} y disfrutá de nuestra carta.`);

  return {
    title: `${restaurant.name} - ${location} - Mangi.ar`,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      ...(restaurant.logoUrl && {
        images: [{ url: restaurant.logoUrl }],
      }),
    },
  };
}

export default async function Home() {
  const subdomain = (await headers()).get("x-subdomain");
  if (subdomain) return <RestaurantLandingPage />;

  return (
    <>
      <Navbar />
      <div className="min-w-full font-sans">
        {/* Hero Section */}
        <section className="font-sans min-h-svh relative overflow-hidden bg-white px-6 py-[20vh] lg:px-28">
          <div className="mx-auto">
            <div className="grid gap-0 lg:grid-cols-12 items-center z-10 relative">
              <div className="col-span-5 space-y-8">
                <div className="inline-block py-4 bg-white rounded-full leading-none px-5 shadow-md text-sm font-semibold uppercase text-red">
                  Sistema Completo de Gestión
                </div>
                <h1 className="text-[clamp(1.875rem,3.5vw,calc(98vw-1rem))] leading-none font-semibold tracking-tight text-black text-pretty">
                  Transformá tu restaurante con{" "}
                  <Logo className="h-[clamp(1.875rem,3.5vw,calc(98vw-1rem))] w-auto" />
                </h1>
                <p className="text-[clamp(1rem,1.2vw,calc(98vw-1rem))] leading-none text-balance text-black font-light mb-12">
                  La plataforma integral que gestiona{" "}
                  <span className="italic font-serif">
                    reservas, ventas, delivery y facturación.
                  </span>{" "}
                  <br />
                  Todo lo que necesitás para hacer crecer tu negocio
                  gastronómico.
                </p>
                <div className="hidden md:flex items-center gap-8 pt-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-5 rounded-xl shadow-md">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      33 funcionalidades
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-5 rounded-xl shadow-md">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      En menos de 2 minutos
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-7 relative p-2">
                <Image
                  src="/images/laptop.png"
                  alt="Laptop con la pantalla abierta mostrando las funcionalidades de la plataforma."
                  width={1800}
                  height={1435}
                  className="w-full h-auto rounded-lg "
                />
              </div>
            </div>
          </div>
          <div className="absolute lg:-top-10 bottom-[-85%] lg:bottom-0 -right-[45vh] bg-red h-[120vh] aspect-square rounded-full z-0"></div>
        </section>
        <Features />
        <Pricing />
        <TrustedBy />
        <Footer />
      </div>
    </>
  );
}

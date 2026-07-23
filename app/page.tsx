import Logo from "@/components/dashboard/logo";
import { HomeLoader } from "@/components/home/home-loader";
import HomeHero from "@/components/home/home-hero";
import { Navbar } from "@/components/home/navbar";
import RestaurantLandingPage from "@/components/landing/restaurant-landing";
import { Features } from "@/components/website/features";
import { Footer } from "@/components/website/footer";
import { getPublicRestaurantAndBranch } from "@/lib/public-branch";
import { LoaderProvider } from "@/lib/loader-context";
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
    <LoaderProvider>
      <HomeLoader />
      <Navbar />
      <div className="min-w-full font-sans">
        <HomeHero />
        <Features />
        {/*<Pricing />
        <TrustedBy />*/}
        <Footer />
      </div>
    </LoaderProvider>
  );
}

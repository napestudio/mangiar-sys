import Logo from "@/components/dashboard/logo";
import { Navbar } from "@/components/home/navbar";
import RestaurantLandingPage from "@/components/landing/restaurant-landing";
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
                {/* <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    className="bg-red font-light hover:bg-white text-white hover:text-red text-lg px-8 rounded-full"
                  >
                    Comenzar Gratis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-2 border-red text-red hover:bg-red-50 bg-transparent rounded-full"
                  >
                    Ver Demo
                  </Button>
                </div> */}
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
                  //src="/sistema-mangiar.webp"
                  src="/images/laptop.png"
                  alt="Laptop con la pantalla abierta mostrando las funcionalidades de la plataforma."
                  width={1800}
                  height={1435}
                  //sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-auto rounded-lg "
                />
              </div>
            </div>
          </div>
          <div className="absolute lg:-top-10 bottom-[-85%] lg:bottom-0 -right-[45vh] bg-red h-[120vh] aspect-square rounded-full z-0"></div>
        </section>

        {/* How it Works */}
        {/* <section className="font-sans bg-white px-6 py-[20vh] lg:px-28">
          <div className="mx-auto max-w-7xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-black lg:text-6xl text-pretty">
                Comenzá en minutos
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
                Tres simples pasos para revolucionar tu restaurante
              </p>
            </div>

            <div className="flex justify-between relative mb-6 mx-auto max-w-3xl">
              <div className="relative text-center z-10">
                <div className="bg-white mx-auto flex h-32 w-32 p-8 items-center justify-center rounded-full border-3 border-red text-2xl font-bold text-red">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    id="Capa_1"
                    version="1.1"
                    viewBox="0 0 117.5 117.5"
                    className="fill-red"
                  >
                    <path d="M110.37,89.23l-3.73-.55c2.62-2.57,4.26-6.14,4.26-10.1,0-7.8-6.34-14.14-14.14-14.14s-14.14,6.34-14.14,14.14c0,3.95,1.64,7.53,4.26,10.1l-3.73.55c-.68.1-1.35.29-1.99.55-1.42-2.34-3.82-4.05-6.67-4.47l-4.9-.73c3.23-2.95,5.27-7.17,5.27-11.88,0-8.88-7.22-16.1-16.1-16.1s-16.1,7.22-16.1,16.1c0,4.71,2.04,8.93,5.27,11.88l-4.9.73c-2.84.42-5.25,2.13-6.67,4.47-.64-.26-1.3-.45-1.99-.55l-3.73-.55c2.62-2.57,4.26-6.14,4.26-10.1,0-7.8-6.34-14.14-14.14-14.14s-14.14,6.34-14.14,14.14c0,3.95,1.63,7.53,4.26,10.1l-3.73.55c-4.07.6-7.13,4.16-7.13,8.27v18.26c0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75v-18.26c0-2.39,1.78-4.46,4.15-4.81l7.54-1.12c1.71.74,3.59,1.15,5.57,1.15s3.86-.41,5.57-1.15l7.54,1.12c.44.07.87.2,1.28.38-.09.5-.14,1.02-.14,1.54v21.14c0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75v-21.14c0-2.9,2.16-5.41,5.04-5.84l8.81-1.31c1.96.86,4.13,1.34,6.4,1.34s4.44-.48,6.4-1.34l8.81,1.31c2.87.43,5.04,2.94,5.04,5.84v21.14c0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75v-21.14c0-.52-.05-1.04-.14-1.54.41-.18.84-.32,1.28-.38l7.54-1.12c1.71.74,3.59,1.15,5.57,1.15s3.86-.41,5.57-1.15l7.54,1.12c2.36.35,4.15,2.42,4.15,4.81v18.26c0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75v-18.26c0-4.11-3.07-7.66-7.13-8.27ZM10.11,78.58c0-5.87,4.77-10.64,10.64-10.64s10.64,4.77,10.64,10.64-4.77,10.64-10.64,10.64-10.64-4.77-10.64-10.64ZM46.15,72.71c0-6.95,5.65-12.6,12.6-12.6s12.6,5.65,12.6,12.6-5.65,12.6-12.6,12.6-12.6-5.65-12.6-12.6ZM86.11,78.58c0-5.87,4.77-10.64,10.64-10.64s10.64,4.77,10.64,10.64-4.77,10.64-10.64,10.64-10.64-4.77-10.64-10.64Z" />
                    <path d="M26.75,14.5h8c.97,0,1.75-.78,1.75-1.75s-.78-1.75-1.75-1.75h-8c-3.17,0-5.75,2.58-5.75,5.75s2.58,5.75,5.75,5.75h4c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25h-8c-.97,0-1.75.78-1.75,1.75s.78,1.75,1.75,1.75h8c3.17,0,5.75-2.58,5.75-5.75s-2.58-5.75-5.75-5.75h-4c-1.24,0-2.25-1.01-2.25-2.25s1.01-2.25,2.25-2.25Z" />
                    <path d="M86.75,14.5h8c.97,0,1.75-.78,1.75-1.75s-.78-1.75-1.75-1.75h-8c-3.17,0-5.75,2.58-5.75,5.75s2.58,5.75,5.75,5.75h4c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25h-8c-.97,0-1.75.78-1.75,1.75s.78,1.75,1.75,1.75h8c3.17,0,5.75-2.58,5.75-5.75s-2.58-5.75-5.75-5.75h-4c-1.24,0-2.25-1.01-2.25-2.25s1.01-2.25,2.25-2.25Z" />
                    <path d="M70.75,11h-8c-.97,0-1.75.78-1.75,1.75v16c0,.97.78,1.75,1.75,1.75h8c3.17,0,5.75-2.58,5.75-5.75,0-1.55-.62-2.96-1.62-4,1-1.04,1.62-2.45,1.62-4,0-3.17-2.58-5.75-5.75-5.75ZM70.75,27h-6.25v-4.5h6.25c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25ZM70.75,19h-6.25v-4.5h6.25c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25Z" />
                    <path d="M54.75,11c-.97,0-1.75.78-1.75,1.75v12c0,1.24-1.01,2.25-2.25,2.25h-4c-1.24,0-2.25-1.01-2.25-2.25v-12c0-.97-.78-1.75-1.75-1.75s-1.75.78-1.75,1.75v12c0,3.17,2.58,5.75,5.75,5.75h4c3.17,0,5.75-2.58,5.75-5.75v-12c0-.97-.78-1.75-1.75-1.75Z" />
                    <path d="M111.75,0H5.75C2.58,0,0,2.58,0,5.75v30c0,3.17,2.58,5.75,5.75,5.75h46.16l5.34,8.77c.32.52.88.84,1.49.84s1.18-.32,1.49-.84l5.34-8.77h46.16c3.17,0,5.75-2.58,5.75-5.75V5.75c0-3.17-2.58-5.75-5.75-5.75ZM114,35.75c0,1.24-1.01,2.25-2.25,2.25h-47.15c-.61,0-1.18.32-1.49.84l-4.36,7.15-4.36-7.15c-.32-.52-.88-.84-1.49-.84H5.75c-1.24,0-2.25-1.01-2.25-2.25V5.75c0-1.24,1.01-2.25,2.25-2.25h106c1.24,0,2.25,1.01,2.25,2.25v30Z" />
                  </svg>{" "}
                </div>
              </div>

              <div className="relative text-center z-10 ">
                <div className="bg-white mx-auto flex h-32 w-32 p-8 items-center justify-center rounded-full border-3 border-red text-2xl font-bold text-red">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    id="Capa_1"
                    version="1.1"
                    viewBox="0 0 117.5 78.5"
                    className="fill-red"
                  >
                    <path
                      className="st0"
                      d="M115.75,67h-6.25V5.75c0-3.17-2.58-5.75-5.75-5.75H13.75c-3.17,0-5.75,2.58-5.75,5.75v61.25H1.75c-.97,0-1.75.78-1.75,1.75v4c0,3.17,2.58,5.75,5.75,5.75h106c3.17,0,5.75-2.58,5.75-5.75v-4c0-.97-.78-1.75-1.75-1.75ZM11.5,5.75c0-1.24,1.01-2.25,2.25-2.25h90c1.24,0,2.25,1.01,2.25,2.25v.75H11.5v-.75ZM11.5,10h94.5v50.5H11.5V10ZM11.5,64h94.5v3h-29.25c-.7,0-1.33.42-1.61,1.06l-.54,1.26h-31.7l-.54-1.26c-.28-.64-.91-1.06-1.61-1.06H11.5v-3ZM114,72.75c0,1.24-1.01,2.25-2.25,2.25H5.75c-1.24,0-2.25-1.01-2.25-2.25v-2.25h36.1l.54,1.26c.28.64.91,1.06,1.61,1.06h34c.7,0,1.33-.41,1.61-1.06l.54-1.26h36.1v2.25Z"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative text-center z-10 ">
                <div className="bg-white mx-auto flex h-32 w-32 p-8 items-center justify-center rounded-full border-3 border-red text-2xl font-bold text-red">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    id="Capa_1"
                    version="1.1"
                    viewBox="0 0 113.5 117.5"
                    className="fill-red"
                  >
                    <path
                      className="st0"
                      d="M93.5,81.02v-32.27c0-17.61-12.45-32.35-29-35.92v-5.08c0-4.27-3.48-7.75-7.75-7.75s-7.75,3.48-7.75,7.75v5.08c-16.55,3.57-29,18.32-29,35.92v32.27l-6.56,6.56c-2.22,2.22-3.44,5.17-3.44,8.31v3.86c0,.97.78,1.75,1.75,1.75h27.34c.88,8.97,8.46,16,17.66,16s16.78-7.03,17.66-16h27.34c.97,0,1.75-.78,1.75-1.75v-3.86c0-3.14-1.22-6.09-3.44-8.31l-6.56-6.56ZM52.5,7.75c0-2.34,1.91-4.25,4.25-4.25s4.25,1.91,4.25,4.25v4.5c-1.4-.16-2.81-.25-4.25-.25s-2.85.09-4.25.25v-4.5ZM23.5,48.75c0-18.33,14.92-33.25,33.25-33.25s33.25,14.92,33.25,33.25v31.25H23.5v-31.25ZM56.75,114c-7.26,0-13.26-5.47-14.13-12.5h28.26c-.87,7.03-6.87,12.5-14.13,12.5ZM100,98H13.5v-2.11c0-2.2.86-4.28,2.42-5.83l6.56-6.56h68.55l6.56,6.56c1.56,1.56,2.42,3.63,2.42,5.83v2.11Z"
                    />
                    <path
                      className="st0"
                      d="M87.33,15.69c-.68.68-.68,1.79,0,2.47,8.17,8.17,12.67,19.03,12.67,30.58,0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75c0-12.49-4.86-24.23-13.69-33.06-.68-.68-1.79-.68-2.47,0Z"
                    />
                    <path
                      className="st0"
                      d="M96.88,8.62c-.68-.68-1.79-.68-2.47,0-.68.68-.68,1.79,0,2.47,10.06,10.06,15.6,23.43,15.6,37.65,0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75c0-15.16-5.9-29.41-16.62-40.13Z"
                    />
                    <path
                      className="st0"
                      d="M11.75,50.5c.97,0,1.75-.78,1.75-1.75,0-11.55,4.5-22.41,12.67-30.58.68-.68.68-1.79,0-2.47-.68-.68-1.79-.68-2.47,0-8.83,8.83-13.69,20.57-13.69,33.06,0,.97.78,1.75,1.75,1.75Z"
                    />
                    <path
                      className="st0"
                      d="M19.1,8.62c-.68-.68-1.79-.68-2.47,0C5.9,19.34,0,33.59,0,48.75c0,.97.78,1.75,1.75,1.75s1.75-.78,1.75-1.75c0-14.22,5.54-27.6,15.6-37.65.68-.68.68-1.79,0-2.47Z"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 z-0 flex items-center">
                <div className="h-0 border-t-3 border-red w-full bg-red"></div>
              </div>
            </div>

            <div className="grid gap-12 md:grid-cols-3 relative  mx-auto max-w-4xl">
              <div className="relative text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">
                  Registrate
                </h3>
                <p className="text-gray-600 leading-relaxed text-balance text-sm">
                  Creá tu cuenta en menos de 2 minutos. Ingresá los datos
                  básicos de tu restaurante.
                </p>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">
                  Configurá
                </h3>
                <p className="text-gray-600 leading-relaxed text-balance text-sm">
                  Definí tus mesas, horarios y preferencias. Nuestro asistente
                  te guía paso a paso.
                </p>
              </div>

              <div className="relative text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">
                  Recibí Reservas
                </h3>
                <p className="text-gray-600 leading-relaxed text-balance text-sm">
                  Compartí tu link de reservas y empezá a recibir clientes. Así
                  de simple.
                </p>
              </div>
            </div>
          </div>
        </section> */}

        {/* <section className="bg-white px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-black lg:text-6xl text-pretty">
                Funcionalidades principales
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
                Las herramientas más poderosas para gestionar tu restaurante de
                forma integral
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-1">
              <Card className="p-8 d-flex flex-row hover:shadow-xl transition-all border-2 hover:border-orange-200 bg-linear-to-br from-white to-orange-50">
                <div className="rounded-full bg-orange-100 w-16 h-16 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <div className="w-3/6 ml-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Gestión de Mesas y Reservas
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Control completo de tu salón con confirmación automática por
                    WhatsApp y asignación inteligente de camareros.
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Confirmación automática por WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Configuración de mapa de salas y mesas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Asignación de camareros sobre ventas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Múltiples turnos y gestión por mesa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Versión móvil para gestión de reservas</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 d-flex flex-row-reverse hover:shadow-xl transition-all border-2 hover:border-blue-200 bg-linear-to-br from-white to-blue-50">
                <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mb-6">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <div className="w-3/6 mr-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ventas Multicanal
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Vendé por mostrador, delivery o con carta QR. Integrá
                    Mercado Pago y gestioná todo desde un solo lugar.
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Ventas por mostrador y delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Carta QR para pedidos sin contacto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Integración con Mercado Pago</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Asignación de repartidores y estado de pedido</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Descuentos fijos y porcentuales</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 d-flex flex-row hover:shadow-xl transition-all border-2 hover:border-purple-200 bg-linear-to-br from-white to-purple-50">
                <div className="rounded-full bg-purple-100 w-16 h-16 flex items-center justify-center mb-6">
                  <Receipt className="h-8 w-8 text-purple-600" />
                </div>
                <div className="w-3/6 ml-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Facturación Electrónica
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Cumplí con AFIP sin complicaciones. Facturación electrónica,
                    impresoras fiscales y control de caja integrado.
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Facturación electrónica AFIP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Soporte para impresoras fiscales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Arqueo de caja automático</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Cierre parcial de venta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>Impresión de comandas y precuenta</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Link href="/funcionalidades">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-2 border-red text-red rounded-full hover:bg-red hover:text-white bg-transparent"
                >
                  Ver todas las funcionalidades
                </Button>
              </Link>
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        {/* <section className="bg-white px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-3xl font-semibold tracking-tight text-black lg:text-6xl text-pretty">
              ¿Listo para llenar tu restaurante?
            </h2>
            <p className="text-xl text-gray-600 text-pretty">
              Unite a cientos de restaurantes que ya confían en mangi.ar para
              gestionar sus reservas
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button
                size="lg"
                className="bg-red hover:bg-red-700 rounded-full text-white text-lg px-8 font-light cursor-pointer"
              >
                Comenzar Prueba Gratuita
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg text-red px-8 border-2 border-red rounded-full bg-transparent"
              >
                Ver Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Prueba gratuita de 14 días • No requiere tarjeta de crédito •
              Cancelá cuando quieras
            </p>
          </div>
        </section> */}

        {/* Footer */}
        {/* <footer className="bg-gray-900 px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">mangi.ar</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  La plataforma de gestión que transforma restaurantes
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Producto</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link
                      href="/funcionalidades"
                      className="hover:text-white transition-colors"
                    >
                      Funcionalidades
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Precios
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Demo
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Empresa</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Sobre Nosotros
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      Términos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
              <p>© 2025 mangi.ar. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer> */}
      </div>
    </>
  );
}

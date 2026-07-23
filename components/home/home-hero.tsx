"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Logo from "../dashboard/logo";
import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect";
import { gsap, SplitText } from "@/lib/gsap";
import { useLoader } from "@/lib/loader-context";
import { ArrowRight } from "lucide-react";

export default function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { ready } = useLoader();

  useIsomorphicLayoutEffect(() => {
    if (!ready) return;

    const ctx = gsap.context(() => {
      const split = new SplitText(headingRef.current, { type: "lines" });

      gsap
        .timeline()
        .from(badgeRef.current, { y: 24, opacity: 0, duration: 0.5 })
        .from(split.lines, { y: 32, opacity: 0, stagger: 0.1 }, "<0.15")
        .from(paragraphRef.current, { y: 20, opacity: 0 }, "<0.2")
        .from(ctaRef.current, { y: 16, opacity: 0 }, "<0.15")
        .from(imageColRef.current, { x: 48, opacity: 0 }, "<0.2")
        .from(
          circleRef.current,
          { scale: 1.15, opacity: 0, duration: 0.8 },
          "<0.1",
        );
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      ref={sectionRef}
      className="font-sans min-h-svh relative overflow-hidden bg-white px-6 py-[20vh] lg:px-28"
    >
      <div className="mx-auto">
        <div className="grid gap-0 lg:grid-cols-12 items-center z-10 relative">
          <div className="col-span-5 space-y-8">
            <div
              ref={badgeRef}
              className="inline-block py-4 bg-white rounded-full leading-none px-5 shadow-md text-sm font-semibold uppercase text-red"
            >
              Sistema Completo de Gestión
            </div>
            <h1
              ref={headingRef}
              className="text-[clamp(1.875rem,3.5vw,calc(98vw-1rem))] leading-none font-semibold tracking-tight text-black text-pretty"
            >
              Transformá tu restaurante con{" "}
              <Logo className="h-[clamp(1.875rem,3.5vw,calc(98vw-1rem))] w-auto" />
            </h1>
            <p
              ref={paragraphRef}
              className="text-[clamp(1rem,1.2vw,calc(98vw-1rem))] leading-none text-balance text-black font-light mb-12"
            >
              La plataforma integral que gestiona{" "}
              <span className="italic font-serif">
                reservas, ventas, delivery y facturación.
              </span>{" "}
              <br />
              Todo lo que necesitás para hacer crecer tu negocio gastronómico.
            </p>
            <div ref={ctaRef}>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 group rounded-full bg-red text-white px-8 py-3.5 font-semibold text-base transition-transform hover:scale-102 duration-500"
              >
                Creá tu restaurante
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 duration-500 transition-transform" />
              </Link>
            </div>
          </div>
          <div ref={imageColRef} className="col-span-7 relative p-2">
            <Image
              src="https://res.cloudinary.com/dztzomvin/image/upload/v1777850260/800_kytskn.png"
              alt="Laptop con la pantalla abierta mostrando las funcionalidades de la plataforma."
              width={800}
              height={642}
              className="w-full brightness-95 md:w-100 2xl:w-175 mx-auto h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
      <div
        ref={circleRef}
        className="absolute lg:-top-10 bottom-[-65%] lg:bottom-0 -right-[45vh] bg-red h-[120vh] aspect-square rounded-full z-0"
      ></div>
    </section>
  );
}

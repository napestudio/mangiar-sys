"use client";

import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect";
import { gsap } from "@/lib/gsap";
import { useLoader } from "@/lib/loader-context";
import { useRef } from "react";
import Logo from "../dashboard/logo";

export function HomeLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const { onLoaded } = useLoader();

  useIsomorphicLayoutEffect(() => {
    const tl = gsap
      .timeline()
      .to(loaderRef.current, {
        yPercent: -100,
        duration: 0.9,
        ease: "power2.inOut",
        delay: 0.35,
        onStart: onLoaded,
      })
      .to(logoRef.current, { y: -20, opacity: 0, duration: 0.5 });

    return () => {
      tl.kill();
    };
  }, [onLoaded]);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-99999 bg-white flex items-center justify-center"
    >
      <div ref={logoRef}>
        <Logo className="h-12 w-auto" />
      </div>
    </div>
  );
}

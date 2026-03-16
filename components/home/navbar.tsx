import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Logo from "../dashboard/logo";

export function Navbar() {
  return (
    <nav className="bg-transparent border-0 fixed inset-x-0 z-50 flex items-center justify-start gap-[12vw] font-sans pt-10 py-4 px-6 lg:px-32">
      {/* Logo a la izquierda */}
      <Link href="/" className="text-2xl font-bold text-black">
        <Logo />
      </Link>

      {/* Enlaces en el centro */}
      {/* <div className="flex items-center gap-8 uppercase font-medium">
        <Link
          href="/"
          className="text-black hover:text-muted-foreground transition-colors"
        >
          Funcionalidades
        </Link>
        <Link
          href="/"
          className="text-black hover:text-muted-foreground transition-colors"
        >
          Precios
        </Link>
      </div> */}

      {/* Botón rojo redondeado */}
      {/* <Button className="cursor-pointer rounded-full bg-white text-red border-2 border-red hover:bg-red hover:text-white transition-colors px-6 py-2 font-medium">
        Ver Demo
      </Button> */}
    </nav>
  );
}

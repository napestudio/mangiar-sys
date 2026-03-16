import type { Metadata } from "next";
import { RegistroForm } from "@/components/registro/registro-form";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Registrá tu negocio y empezá a gestionar tus pedidos y reservas.",
};

export default function RegistroPage() {
  return (
    <div className="min-h-svh bg-white flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Creá tu cuenta y probá{" "}
            <span className="text-red-600">Mangiar</span>{" "}
            de forma gratuita
          </h1>
        </div>

        <RegistroForm />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <a
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Ingresá aquí
          </a>
        </p>
      </div>
    </div>
  );
}

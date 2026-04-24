import Logo from "@/components/dashboard/logo";
import { navItems } from "@/components/website/nav-items";
import Link from "next/link";

const extraLinks = [
  { label: "Ingresar", href: "/ingresar" },
  { label: "Registrarse", href: "/registro" },
];

const legal = [
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
  { label: "Contacto", href: "mailto:hola@mangi.ar" },
];

export function Footer() {
  return (
    <footer className="font-sans bg-[#171717] text-white py-16 px-6 lg:px-28">
      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Logo className="h-8 w-auto" />
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Sistema de gestión integral para restaurantes, bares, cafeterías y
              todo tipo de negocios gastronómicos.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Plataforma
            </h4>
            <ul className="space-y-3">
              {[...navItems, ...extraLinks].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} Mangi.ar — Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

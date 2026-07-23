"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Salón y Mesas",
    items: [
      { label: "Gestión del salón y mesas", href: "/docs/salon" },
    ],
  },
  {
    title: "Mostrador",
    items: [
      { label: "Venta por mostrador", href: "/docs/mostrador" },
    ],
  },
];

function NavSection({ section }: { section: NavSection }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      >
        {section.title}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="relative">
                {isActive && (
                  <span className="w-0.5 h-5 rounded-full bg-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                )}
                <Link
                  href={item.href}
                  className={`flex items-center pl-6 pr-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DocsSidebar() {
  return (
    <nav className="p-3">
      {navSections.map((section) => (
        <NavSection key={section.title} section={section} />
      ))}
    </nav>
  );
}

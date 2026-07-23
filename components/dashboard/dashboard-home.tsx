"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  LayoutGrid,
  Package,
} from "lucide-react";

const quickLinks = [
  {
    label: "Mesas",
    href: "/dashboard/tables",
    icon: UtensilsCrossed,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-200",
  },
  {
    label: "Pedidos",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200",
  },
  {
    label: "Reservas",
    href: "/dashboard/reservations",
    icon: Calendar,
    color: "text-red-600",
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-200",
  },
  {
    label: "Mostrador",
    href: "/dashboard/quick-sale",
    icon: LayoutGrid,
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100",
    border: "border-violet-200",
  },
  {
    label: "Stock",
    href: "/dashboard/stock",
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-200",
  },
];

export function DashboardHome() {
  return (
    <div className="min-h-svh bg-neutral-50">
      <main className="px-4 sm:px-6 lg:px-8 py-6 pt-20">
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`rounded-xl border p-5 flex items-center gap-4 cursor-pointer transition-colors ${link.bg} ${link.border}`}
                  >
                    <Icon className={`h-9 w-9 ${link.color} shrink-0`} />
                    <div className="font-bold text-gray-900 text-lg leading-tight">
                      {link.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

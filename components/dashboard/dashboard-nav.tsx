"use client";

import { cn } from "@/lib/utils";
import {
  Archive,
  BarChart2,
  CalendarDays,
  ClipboardList,
  House,
  Menu,
  Package,
  Receipt,
  Settings,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import ArqueosIcon from "@/components/ui/icons/ArqueosIcon";
import CartasIcon from "@/components/ui/icons/CartasIcon";
import TableIcon from "@/components/ui/icons/TableIcon";
import Link from "next/link";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  House,
  TableIcon,
  ClipboardList,
  CalendarDays,
  ArqueosIcon,
  BarChart2,
  CartasIcon,
  Package,
  Archive,
  Receipt,
  Settings,
};
import { usePathname } from "next/navigation";
import { useState } from "react";
import DashBoardNavItems from "./dashboard-nav-items";
import UserDropdown from "./user-dropdown";
import Logo from "./logo";
import { UserRole } from "@/app/generated/prisma";

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  minimumRole?: string;
}

interface DashboardNavProps {
  userName: string;
  userRole: UserRole | null;
  navItems: NavItem[];
  userImage?: string | null;
  restaurantName?: string | null;
}

export function DashboardNav({
  userName,
  userRole,
  navItems,
  userImage,
  restaurantName,
}: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentPath = usePathname();

  return (
    <nav className="bg-white fixed w-full z-10">
      <div className="mx-auto px-4 sm:px-4 lg:px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left: Logo/Title */}
          <div className="flex items-center">
            <Logo />
          </div>

          <div className="hidden sm:flex items-center justify-between p-2 border border-black/1 shadow-md rounded-full">
            <DashBoardNavItems navItems={navItems} />
          </div>

          <div className="flex items-center gap-2">
            <UserDropdown userName={userName} userRole={userRole} userImage={userImage} restaurantName={restaurantName} />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t py-2">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.href;
                const Icon = item.icon ? iconMap[item.icon] : null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "font-bold text-white bg-red-500"
                        : "text-neutral-800 hover:bg-gray-100 hover:text-red-500",
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

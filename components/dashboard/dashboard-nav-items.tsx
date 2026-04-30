"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart2,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  House,
  Package,
  Receipt,
  Settings,
  Sliders,
} from "lucide-react";
import type { ComponentType } from "react";
import ArqueosIcon from "@/components/ui/icons/ArqueosIcon";
import CartasIcon from "@/components/ui/icons/CartasIcon";
import TableIcon from "@/components/ui/icons/TableIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  FlaskConical,
  Sliders,
};

export default function DashBoardNavItems({
  navItems,
}: {
  navItems: { label: string; href: string; icon?: string }[];
}) {
  const currentPath = usePathname();

  return (
    <div className="hidden sm:flex gap-1">
      {navItems.map((item) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon ? iconMap[item.icon] : null;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={`inline-flex items-center justify-center size-10 rounded-full transition-colors ${
                  isActive
                    ? "text-neutral-100 bg-red-500"
                    : "text-neutral-600 hover:text-red-500 hover:bg-neutral-100"
                }`}
              >
                {Icon ? <Icon className="size-5" /> : item.label}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

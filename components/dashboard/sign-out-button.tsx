"use client";

import { logoutAction } from "@/actions/auth";
import { showLogoutOverlay } from "@/contexts/logout-context";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "../ui/dropdown-menu";

export function SignOutButton() {
  const handleSignOut = async () => {
    showLogoutOverlay();
    await logoutAction();
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
    const protocol = root.startsWith("localhost") ? "http" : "https";
    window.location.href = `${protocol}://${root}/ingresar`;
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        handleSignOut();
      }}
      className="cursor-pointer text-red-600 focus:text-red-600"
    >
      <LogOut className="mr-2 size-4" />
      Cerrar sesión
    </DropdownMenuItem>
  );
}

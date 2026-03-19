"use client";

import { showLogoutOverlay } from "@/contexts/logout-context";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "../ui/dropdown-menu";

export function SignOutButton() {
  const handleSignOut = () => {
    showLogoutOverlay();
    window.location.href = "/api/logout";
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

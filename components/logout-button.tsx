"use client";

import { useTransition } from "react";
import { showLogoutOverlay } from "@/contexts/logout-context";
import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    showLogoutOverlay();
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      Cerrar sesión
    </button>
  );
}

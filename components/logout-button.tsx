"use client";

import { showLogoutOverlay } from "@/contexts/logout-context";
import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  const handleLogout = async () => {
    showLogoutOverlay();
    await logoutAction();
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
    const protocol = root.startsWith("localhost") ? "http" : "https";
    window.location.href = `${protocol}://${root}/ingresar`;
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

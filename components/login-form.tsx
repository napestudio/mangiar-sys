"use client";

import { loginWithCredentials } from "@/actions/login";
import { hideLogoutOverlay } from "@/contexts/logout-context";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Encendiendo hornallas...",
  "Calentando la cafetera...",
  "Prendiendo el horno...",
];

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginWithCredentials, null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    hideLogoutOverlay();
  }, []);

  useEffect(() => {
    if (!isPending) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPending]);

  return (
    <div className="w-full">
      <div>
        <h2 className="text-center text-3xl text-neutral-700">INGRESAR</h2>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isPending}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute inset-y-0 right-0 z-20 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 disabled:opacity-40"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-neutral-50 bg-red-700 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {LOADING_MESSAGES[loadingMsgIndex]}
              </span>
            ) : (
              "Ingresar"
            )}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link
            href="/recuperar-contrasena"
            className="text-neutral-500 hover:text-red-700"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </div>
  );
}

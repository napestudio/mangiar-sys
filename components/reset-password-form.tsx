"use client";

import { resetPassword } from "@/actions/password-reset";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, action, isPending] = useActionState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (state?.success) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl text-neutral-700">NUEVA CONTRASEÑA</h2>
        </div>
        <div className="rounded-md bg-green-50 p-6 text-center">
          <p className="text-green-800 font-medium mb-1">
            Contraseña actualizada
          </p>
          <p className="text-green-700 text-sm">
            Tu contraseña fue restablecida correctamente.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/ingresar"
            className="group relative inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md text-neutral-50 bg-red-700 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <h2 className="text-center text-3xl text-neutral-700">
          NUEVA CONTRASEÑA
        </h2>
        <p className="text-center text-sm text-neutral-500 mt-2">
          Elegí una nueva contraseña para tu cuenta.
        </p>
      </div>

      <form action={action} className="space-y-6 mt-6">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isPending}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute inset-y-0 right-0 z-20 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-40"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Repetí la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                disabled={isPending}
                aria-label={
                  showConfirm
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
                className="absolute inset-y-0 right-0 z-20 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-40"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          La contraseña debe tener al menos 8 caracteres e incluir mayúsculas,
          minúsculas y números.
        </p>

        {state?.success === false && state.error && (
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
                Guardando...
              </span>
            ) : (
              "Restablecer contraseña"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

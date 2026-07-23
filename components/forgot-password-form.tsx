"use client";

import { requestPasswordReset } from "@/actions/password-reset";
import Link from "next/link";
import { useActionState } from "react";

export default function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl text-neutral-700">RECUPERAR CONTRASEÑA</h2>
        </div>
        <div className="rounded-md bg-green-50 p-6 text-center">
          <p className="text-green-800 font-medium mb-1">Solicitud enviada</p>
          <p className="text-green-700 text-sm">
            Si existe una cuenta con ese email, se enviará un enlace de
            recuperación al correo del restaurante asociado.
          </p>
        </div>
        <div className="text-center text-sm">
          <Link href="/ingresar" className="text-red-700 hover:text-red-900">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <h2 className="text-center text-3xl text-neutral-700">
          RECUPERAR CONTRASEÑA
        </h2>
        <p className="text-center text-sm text-neutral-500 mt-2">
          Ingresá el email con el que iniciás sesión y enviaremos un enlace de
          recuperación al correo del restaurante.
        </p>
      </div>

      <form action={action} className="space-y-6 mt-6">
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
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Email"
          />
        </div>

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
                Enviando...
              </span>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link href="/ingresar" className="text-red-700 hover:text-red-900">
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}

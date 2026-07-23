import ResetPasswordForm from "@/components/reset-password-form";
import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  const isInvalid =
    !resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date();

  return (
    <div className="min-h-svh place-content-center bg-red-700 text-neutral-900 relative overflow-hidden">
      <div className="bg-white max-w-110 mx-auto p-4 md:p-6 flex rounded-lg justify-center flex-col items-center gap-8 shadow-xl">
        <div className="px-12 w-full">
          <div className="relative w-full max-w-[80svw] md:max-w-sm h-22">
            <Image
              src="https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
              alt="Logo Mangiar Rojo"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        {isInvalid ? (
          <div className="w-full space-y-6">
            <h2 className="text-center text-3xl text-neutral-700">
              NUEVA CONTRASEÑA
            </h2>
            <div className="rounded-md bg-red-50 p-6 text-center">
              <p className="text-red-800 font-medium mb-1">
                Enlace inválido o expirado
              </p>
              <p className="text-red-700 text-sm">
                Este enlace de recuperación ya no es válido. Por favor solicitá
                uno nuevo.
              </p>
            </div>
            <div className="text-center text-sm">
              <Link
                href="/recuperar-contrasena"
                className="text-red-700 hover:text-red-900"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
      <div className="w-full flex justify-center py-12">
        <Link
          href="/"
          className="flex items-center font-semibold gap-2 text-white hover:text-gray-200"
        >
          <ArrowLeft /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}

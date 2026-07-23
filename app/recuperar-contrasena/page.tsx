import ForgotPasswordForm from "@/components/forgot-password-form";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
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

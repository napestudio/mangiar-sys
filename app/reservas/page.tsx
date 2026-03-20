import type { Metadata } from "next";
import Avatar from "@/components/avatar";
import { ReservationWizard } from "@/components/home/reservation-wizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPublicRestaurantAndBranch } from "@/lib/public-branch";

export const metadata: Metadata = {
  title: "Reservas",
  description: "Reservá tu mesa online",
  openGraph: {
    title: "Reservas",
    description: "Reservá tu mesa online",
    images: [
      {
        url: "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg",
      },
    ],
  },
};

export default async function ReservationPage() {
  const data = await getPublicRestaurantAndBranch();

  if (!data) {
    return <p>Error: Branch ID no está configurado.</p>;
  }

  const { branchId, restaurant } = data;

  return (
    <>
      <div className="min-h-svh text-center place-content-center py-16 space-y-6 bg-black">
        <div className="max-w-125 mx-auto px-4 md:px-0 flex justify-center flex-col items-center gap-4">
          <Avatar src={restaurant.logoUrl} alt={restaurant.name} />
          <h1 className="text-4xl text-white leading-none">Reservá tu mesa</h1>
          <div className="bg-white rounded-md w-full py-6 px-2">
            <ReservationWizard branchId={branchId} />
          </div>
          <div>
            <Link href="/" className="text-neutral-200 font-semibold">
              <ArrowLeft className="inline-block mr-2 h-4 w-4" />
              Inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

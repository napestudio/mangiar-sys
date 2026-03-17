import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserBranchesWithRestaurant } from "@/lib/user-branch";
import { buildSubdomainUrl } from "@/lib/constants";
import BranchPicker from "@/components/auth/branch-picker";

export default async function SeleccionarPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/ingresar");
  }

  const branches = await getUserBranchesWithRestaurant(session.user.id);

  if (branches.length === 0) {
    return (
      <div className="min-h-svh grid place-content-center text-center px-8">
        <h1 className="text-xl font-semibold">Sin acceso</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tu cuenta no tiene sucursales asignadas. Contactá al administrador.
        </p>
      </div>
    );
  }

  const uniqueRestaurants = [
    ...new Map(branches.map((b) => [b.restaurant.id, b.restaurant])).values(),
  ];

  if (uniqueRestaurants.length === 1) {
    redirect(buildSubdomainUrl(uniqueRestaurants[0].slug, "/dashboard"));
  }

  return <BranchPicker branches={branches} />;
}

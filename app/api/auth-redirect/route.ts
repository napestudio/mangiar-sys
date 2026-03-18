import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserBranchesWithRestaurant } from "@/lib/user-branch";
import { buildSubdomainUrl } from "@/lib/constants";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/ingresar");
  }

  const branches = await getUserBranchesWithRestaurant(session.user.id);

  if (branches.length === 0) {
    redirect("/ingresar");
  }

  const uniqueRestaurants = [
    ...new Map(branches.map((b) => [b.restaurant.id, b.restaurant])).values(),
  ];

  redirect(buildSubdomainUrl(uniqueRestaurants[0].slug, "/dashboard"));
}

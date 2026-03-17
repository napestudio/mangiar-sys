import { auth, signOut } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.id) {
    revalidateTag("user-permissions");
    revalidateTag("user-permission-grants");
  }
  await signOut({ redirectTo: new URL("/ingresar", request.url).toString() });
}

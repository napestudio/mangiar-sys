import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PROTOCOL = ROOT.startsWith("localhost") ? "http" : "https";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/ingresar");
  }

  redirect(`${PROTOCOL}://${ROOT}/dashboard`);
}

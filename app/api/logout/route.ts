import { NextResponse } from "next/server";

export async function GET() {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const protocol = root.startsWith("localhost") ? "http" : "https";
  return NextResponse.redirect(`${protocol}://${root}/ingresar`, { status: 302 });
}

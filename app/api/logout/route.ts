import { SITE_URL } from "@/lib/constants";

export async function GET(request: Request) {
  return Response.redirect(new URL(`${SITE_URL}/ingresar`, request.url), 302);
}

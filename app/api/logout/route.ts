export async function GET(request: Request) {
  return Response.redirect(new URL("/ingresar", request.url), 302);
}

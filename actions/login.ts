"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/api/auth-redirect",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Usuario o Contraseña incorrectos" };
        default:
          return { error: "Algo salió mal" };
      }
    }
    throw error;
  }
  return null; // unreachable — signIn throws NEXT_REDIRECT on success
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/api/auth-redirect" });
}

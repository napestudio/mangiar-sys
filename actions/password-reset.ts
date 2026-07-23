"use server";

import { randomBytes } from "crypto";
import { hash } from "@node-rs/bcrypt";
import prisma from "@/lib/prisma";
import { getResendClient } from "@/lib/resend";
import { generatePasswordResetEmail } from "@/lib/email-templates/password-reset";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/user";

const EXPIRES_IN_MINUTES = 60;

type RequestResetState = { success: true } | { success: false; error: string } | null;
type ResetPasswordState = { success: true } | { success: false; error: string } | null;

export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const validation = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Email inválido",
    };
  }

  const { email } = validation.data;

  try {
    // Look up the user by their login email (User.email)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userOnBranches: {
          take: 1,
          include: {
            branch: {
              include: {
                restaurant: {
                  select: { id: true, name: true, contactEmail: true },
                },
              },
            },
          },
        },
      },
    });

    // No reveal whether the user exists — always return success
    if (!user) {
      return { success: true };
    }

    const restaurant = user.userOnBranches[0]?.branch?.restaurant;
    const recipientEmail = restaurant?.contactEmail;

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a cryptographically secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRES_IN_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    if (recipientEmail && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
      const protocol = rootDomain.startsWith("localhost") ? "http" : "https";
      const resetUrl = `${protocol}://${rootDomain}/recuperar-contrasena/${token}`;

      const html = generatePasswordResetEmail({
        userName: user.name ?? user.username,
        restaurantName: restaurant.name,
        resetUrl,
        expiresInMinutes: EXPIRES_IN_MINUTES,
      });

      const resend = getResendClient();
      const from = `${restaurant.name} vía Mangiar <${process.env.EMAIL_FROM}>`;

      await resend.emails.send({
        from,
        to: [recipientEmail],
        subject: "Recuperación de contraseña - Mangiar",
        html,
      });
    }
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    // Still return success to avoid leaking info
  }

  return { success: true };
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = formData.get("token");

  if (!token || typeof token !== "string") {
    return { success: false, error: "Token inválido" };
  }

  const validation = resetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { newPassword } = validation.data;

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (!resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "El enlace de recuperación es inválido o ya expiró. Solicitá uno nuevo.",
      };
    }

    const passwordHash = await hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return {
      success: false,
      error: "Ocurrió un error al restablecer la contraseña. Intentá de nuevo.",
    };
  }
}

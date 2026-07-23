"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  userRegistrationSchema,
  userUpdateSchema,
  changePasswordSchema,
  resetPasswordSchema,
  UserRegistrationInput,
  UserUpdateInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/user";
import { hash, compare } from "@node-rs/bcrypt";
import { revalidatePath, revalidateTag } from "next/cache";
import type { UserWithBranches } from "@/types/user";
import { UserRole } from "@/app/generated/prisma";
import { authorizeAction } from "@/lib/permissions/middleware";

export async function createUser(data: UserRegistrationInput) {
  try {
    // Authorization check - ADMIN and above can create users
    const { userRole, branchId: sessionBranchId } = await authorizeAction(UserRole.ADMIN);

    // Validate input
    const validation = userRegistrationSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const { username, name, password, role, branchId } = validation.data;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return {
        success: false,
        error: "A user with this username already exists",
      };
    }

    // Check if branch exists (include restaurant slug for email generation)
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: { select: { slug: true, id: true } } },
    });

    if (!branch) {
      return {
        success: false,
        error: "Invalid branch selected",
      };
    }

    // Tenant isolation: verify branch belongs to the same restaurant
    if (userRole !== UserRole.SUPERADMIN) {
      const sessionBranch = await prisma.branch.findUnique({
        where: { id: sessionBranchId },
        select: { restaurantId: true },
      });
      if (branch.restaurant.id !== sessionBranch?.restaurantId) {
        return {
          success: false,
          error: "No tienes permisos para asignar esta sucursal",
        };
      }
    }

    // Generate email from username and restaurant slug
    const email = `${username}@${branch.restaurant.slug}.com`;

    // Check if generated email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return {
        success: false,
        error: "A user with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user and assign to branch
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        userOnBranches: {
          create: {
            branchId,
            role,
          },
        },
      },
      include: {
        userOnBranches: {
          include: {
            branch: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getBranches() {
  try {
    const { userRole, branchId } = await authorizeAction(UserRole.ADMIN);

    let restaurantId: string | null = null;
    if (userRole !== UserRole.SUPERADMIN) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { restaurantId: true },
      });
      restaurantId = branch?.restaurantId ?? null;
    }

    const branches = await prisma.branch.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: {
        restaurant: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: branches,
    };
  } catch (error) {
    console.error("Error fetching branches:", error);
    return {
      success: false,
      error: "Failed to fetch branches",
      data: [],
    };
  }
}

export async function getUsers(): Promise<{
  success: boolean;
  data?: UserWithBranches[];
  error?: string;
}> {
  try {
    const { userRole, branchId } = await authorizeAction(UserRole.ADMIN);

    let restaurantId: string | null = null;
    if (userRole !== UserRole.SUPERADMIN) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { restaurantId: true },
      });
      restaurantId = branch?.restaurantId ?? null;
    }

    const users = await prisma.user.findMany({
      where: restaurantId
        ? { userOnBranches: { some: { branch: { restaurantId } } } }
        : undefined,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,

        userOnBranches: {
          select: {
            id: true,
            role: true,
            branch: {
              select: {
                id: true,
                name: true,
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers: UserWithBranches[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      userOnBranches: user.userOnBranches.map((ub) => ({
        id: ub.id,
        branchId: ub.branch.id,
        name: ub.branch.name,
        role: ub.role,
        restaurant: {
          id: ub.branch.restaurant.id,
          name: ub.branch.restaurant.name,
        },
      })),
    }));

    return {
      success: true,
      data: formattedUsers,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Error al obtener usuarios",
    };
  }
}

export async function updateUser(
  userId: string,
  data: UserUpdateInput,
): Promise<{
  success: boolean;
  data?: { id: string; name: string | null; email: string | null };
  error?: string;
  message?: string;
}> {
  try {
    // Authorization check - ADMIN and above can update users
    const { userRole, branchId: sessionBranchId } = await authorizeAction(UserRole.ADMIN);

    const validation = userUpdateSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const { username, name, email, password, role, branchId } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userOnBranches: {
          include: { branch: { select: { restaurantId: true } } },
        },
      },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Tenant isolation: verify target user belongs to the same restaurant
    if (userRole !== UserRole.SUPERADMIN) {
      const sessionBranch = await prisma.branch.findUnique({
        where: { id: sessionBranchId },
        select: { restaurantId: true },
      });
      const userRestaurantIds = existingUser.userOnBranches.map(
        (ub) => ub.branch.restaurantId,
      );
      if (!userRestaurantIds.includes(sessionBranch?.restaurantId ?? "")) {
        return {
          success: false,
          error: "No tienes permisos para modificar este usuario",
        };
      }

      // Also verify the target branchId belongs to the same restaurant
      const targetBranch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { restaurantId: true },
      });
      if (targetBranch?.restaurantId !== sessionBranch?.restaurantId) {
        return {
          success: false,
          error: "No tienes permisos para asignar esta sucursal",
        };
      }
    }

    // Check if username is taken by another user
    if (username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists) {
        return {
          success: false,
          error: "El nombre de usuario ya existe",
        };
      }
    }

    // Check if email is taken by another user
    if (email && email.trim() !== "" && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return {
          success: false,
          error: "El email ya está en uso",
        };
      }
    }

    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return {
        success: false,
        error: "Sucursal no válida",
      };
    }

    // Prepare update data
    const updateData: {
      username: string;
      name: string;
      email: string | null;
      password?: string;
    } = {
      username,
      name,
      email: email && email.trim() !== "" ? email : null,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update or create branch assignment
    const existingBranchAssignment = existingUser.userOnBranches.find(
      (ub) => ub.branchId === branchId,
    );

    if (existingBranchAssignment) {
      // Update role if same branch
      await prisma.userOnBranch.update({
        where: { id: existingBranchAssignment.id },
        data: { role },
      });
    } else {
      // Delete old assignments and create new one
      await prisma.userOnBranch.deleteMany({
        where: { userId },
      });

      await prisma.userOnBranch.create({
        data: {
          userId,
          branchId,
          role,
        },
      });
    }

    revalidatePath("/dashboard/config/users");
    revalidateTag("user-role-and-branch");

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
      message: "Usuario actualizado correctamente",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: "Error al actualizar usuario",
    };
  }
}

export async function deleteUser(userId: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    // Authorization check - ADMIN and above can delete users
    const { userId: sessionUserId, userRole, branchId: sessionBranchId } = await authorizeAction(UserRole.ADMIN);

    // Prevent self-deletion
    if (sessionUserId === userId) {
      return {
        success: false,
        error: "No puedes eliminar tu propio usuario",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedOrders: {
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
          },
        },
        userOnBranches: {
          include: { branch: { select: { restaurantId: true } } },
        },
      },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Tenant isolation: verify target user belongs to the same restaurant
    if (userRole !== UserRole.SUPERADMIN) {
      const sessionBranch = await prisma.branch.findUnique({
        where: { id: sessionBranchId },
        select: { restaurantId: true },
      });
      const userRestaurantIds = existingUser.userOnBranches.map(
        (ub) => ub.branch.restaurantId,
      );
      if (!userRestaurantIds.includes(sessionBranch?.restaurantId ?? "")) {
        return {
          success: false,
          error: "No tienes permisos para eliminar este usuario",
        };
      }
    }

    // Check if user has active orders
    if (existingUser.assignedOrders.length > 0) {
      return {
        success: false,
        error: "No se puede eliminar un usuario con pedidos activos",
      };
    }

    // Delete branch assignments first
    await prisma.userOnBranch.deleteMany({
      where: { userId },
    });

    // Delete accounts and sessions
    await prisma.account.deleteMany({
      where: { userId },
    });

    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/dashboard/config/users");

    return {
      success: true,
      message: "Usuario eliminado correctamente",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: "Error al eliminar usuario",
    };
  }
}

import type { WaiterData } from "@/types/user";
export type { WaiterData };

export async function getWaitersForBranch(branchId: string): Promise<{
  success: boolean;
  data?: WaiterData[];
  error?: string;
}> {
  try {
    const userOnBranches = await prisma.userOnBranch.findMany({
      where: {
        branchId,
        role: {
          in: ["WAITER", "EMPLOYEE", "MANAGER", "ADMIN"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const waiters: WaiterData[] = userOnBranches.map((ub) => ({
      id: ub.user.id,
      name: ub.user.name,
      username: ub.user.username,
    }));

    return {
      success: true,
      data: waiters,
    };
  } catch (error) {
    console.error("Error fetching waiters:", error);
    return {
      success: false,
      error: "Error al obtener camareros",
    };
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function updateOwnPassword(
  data: ChangePasswordInput,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No estás autenticado" };
    }

    const validation = changePasswordSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    if (!user.password) {
      return {
        success: false,
        error:
          "Tu cuenta usa Google para iniciar sesión y no tiene contraseña configurada",
      };
    }

    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: await hash(newPassword, 10) },
    });

    return { success: true, message: "Contraseña actualizada correctamente" };
  } catch (error) {
    console.error("Error updating own password:", error);
    return { success: false, error: "Error al actualizar la contraseña" };
  }
}

export async function resetUserPassword(
  userId: string,
  data: ResetPasswordInput,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const { userRole, branchId: sessionBranchId } = await authorizeAction(
      UserRole.ADMIN,
    );

    const validation = resetPasswordSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { newPassword } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userOnBranches: {
          include: { branch: { select: { restaurantId: true } } },
        },
      },
    });

    if (!existingUser) {
      return { success: false, error: "Usuario no encontrado" };
    }

    if (userRole !== UserRole.SUPERADMIN) {
      const sessionBranch = await prisma.branch.findUnique({
        where: { id: sessionBranchId },
        select: { restaurantId: true },
      });
      const userRestaurantIds = existingUser.userOnBranches.map(
        (ub) => ub.branch.restaurantId,
      );
      if (!userRestaurantIds.includes(sessionBranch?.restaurantId ?? "")) {
        return {
          success: false,
          error: "No tienes permisos para modificar este usuario",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hash(newPassword, 10) },
    });

    revalidateTag("user-role-and-branch");

    return { success: true, message: "Contraseña restablecida correctamente" };
  } catch (error) {
    console.error("Error resetting user password:", error);
    return { success: false, error: "Error al restablecer la contraseña" };
  }
}

export async function updateUserAvatar(
  userId: string,
  avatarPath: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { AVATARS } = await import("@/lib/avatars");

    if (!(AVATARS as readonly string[]).includes(avatarPath)) {
      return { success: false, error: "Avatar no válido" };
    }

    const { userRole, branchId: sessionBranchId } = await authorizeAction(
      UserRole.ADMIN,
    );

    if (userRole !== UserRole.SUPERADMIN) {
      const sessionBranch = await prisma.branch.findUnique({
        where: { id: sessionBranchId },
        select: { restaurantId: true },
      });
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          userOnBranches: { select: { branch: { select: { restaurantId: true } } } },
        },
      });
      const targetRestaurantIds =
        targetUser?.userOnBranches.map((ub) => ub.branch.restaurantId) ?? [];
      if (!targetRestaurantIds.includes(sessionBranch?.restaurantId ?? "")) {
        return { success: false, error: "No tienes permisos para modificar este usuario" };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: avatarPath },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, error: "Error al actualizar el avatar" };
  }
}

"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug, buildAdminEmail } from "@/lib/slug-utils";
import { step1Schema, step2Schema } from "@/lib/validations/registro";
import { getSampleData } from "@/lib/sample-data";
import { PriceType, UserRole } from "@/app/generated/prisma";
import type { Step1Data, Step2Data } from "@/lib/validations/registro";
import type { ActionResult } from "@/types/action-result";

type SlugCheckResult = { slug: string; available: boolean };

export async function checkSlugAvailability(
  businessName: string
): Promise<ActionResult<SlugCheckResult>> {
  try {
    const slug = generateSlug(businessName);

    if (slug.length < 2) {
      return { success: true, data: { slug, available: false } };
    }

    const [existingRestaurant, reservedSlug] = await Promise.all([
      prisma.restaurant.findUnique({ where: { slug }, select: { id: true } }),
      prisma.reservedSlug.findUnique({ where: { slug }, select: { slug: true } }),
    ]);

    return {
      success: true,
      data: {
        slug,
        available: !existingRestaurant && !reservedSlug,
      },
    };
  } catch {
    return { success: false, error: "Error al verificar disponibilidad" };
  }
}

export async function registerRestaurant(
  step1: Step1Data,
  step2: Step2Data
): Promise<ActionResult<{ slug: string }>> {
  // 1. Server-side re-validation
  const v1 = step1Schema.safeParse(step1);
  if (!v1.success) {
    return { success: false, error: v1.error.issues[0].message };
  }

  const v2 = step2Schema.safeParse(step2);
  if (!v2.success) {
    return { success: false, error: v2.error.issues[0].message };
  }

  const { businessName, phone, contactEmail, password } = v1.data;
  const { personName, restaurantType, promoCode } = v2.data;

  // 2. Generate slug and verify availability
  const slug = generateSlug(businessName);

  if (slug.length < 2) {
    return { success: false, error: "El nombre del negocio genera un identificador inválido" };
  }

  const slugCheck = await checkSlugAvailability(businessName);
  if (!slugCheck.success || !slugCheck.data.available) {
    return { success: false, error: "El nombre del negocio ya está en uso. Probá con otro." };
  }

  const adminEmail = buildAdminEmail(slug);

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Get type-specific sample data
  const sampleData = getSampleData(restaurantType);

  // 5. Create all entities in a single atomic transaction
  try {
    await prisma.$transaction(
      async (tx) => {
        // Restaurant
        const restaurant = await tx.restaurant.create({
          data: {
            name: businessName,
            slug,
            phone,
            contactEmail,
            restaurantType,
            promoCode: promoCode && promoCode.trim() !== "" ? promoCode.trim() : null,
          },
        });

        // Branch "Principal"
        const branch = await tx.branch.create({
          data: {
            name: "Principal",
            address: "Principal",
            restaurantId: restaurant.id,
          },
        });

        // Admin user — username = adminEmail for global uniqueness
        const user = await tx.user.create({
          data: {
            username: adminEmail,
            email: adminEmail,
            name: personName,
            password: hashedPassword,
          },
        });

        // UserOnBranch with ADMIN role
        await tx.userOnBranch.create({
          data: {
            userId: user.id,
            branchId: branch.id,
            role: UserRole.ADMIN,
          },
        });

        // Categories
        const createdCategories = await Promise.all(
          sampleData.categories.map((name, order) =>
            tx.category.create({
              data: { name, order, restaurantId: restaurant.id },
            })
          )
        );

        const categoryMap = new Map(createdCategories.map((c) => [c.name, c.id]));

        // Products + ProductOnBranch + ProductPrice (DINE_IN) — nested creates to reduce round-trips
        const createdProducts = await Promise.all(
          sampleData.products.map((p) =>
            tx.product.create({
              data: {
                name: p.name,
                description: p.description,
                restaurantId: restaurant.id,
                categoryId: categoryMap.get(p.category) ?? null,
                productOnBranches: {
                  create: [
                    {
                      branchId: branch.id,
                      stock: 0,
                      productPrices: {
                        create: [{ type: PriceType.DINE_IN, price: p.price }],
                      },
                    },
                  ],
                },
              },
              select: { id: true, categoryId: true },
            })
          )
        );

        // Build categoryId → productId[] map from creation results (avoids findMany queries)
        const categoryProductMap = new Map<string, string[]>();
        for (const p of createdProducts) {
          if (p.categoryId) {
            const list = categoryProductMap.get(p.categoryId) ?? [];
            list.push(p.id);
            categoryProductMap.set(p.categoryId, list);
          }
        }

        // 5 tables (numbered 1–5, no sector) — spread in a 3+2 grid so they don't overlap
        const tablePositions = [
          { positionX: 10, positionY: 10 },
          { positionX: 110, positionY: 10 },
          { positionX: 210, positionY: 10 },
          { positionX: 10, positionY: 110 },
          { positionX: 110, positionY: 110 },
        ];
        await tx.table.createMany({
          data: Array.from({ length: 5 }, (_, i) => ({
            number: i + 1,
            capacity: 4,
            branchId: branch.id,
            positionX: tablePositions[i].positionX,
            positionY: tablePositions[i].positionY,
            width: 80,
            height: 80,
            shape: "SQUARE",
          })),
        });

        // Cash register "Principal"
        await tx.cashRegister.create({
          data: {
            name: "Principal",
            branchId: branch.id,
          },
        });

        // Menu "Carta"
        const menuSlug = `carta${slug}`;
        const menu = await tx.menu.create({
          data: {
            name: "Carta",
            slug: menuSlug,
            priceType: PriceType.DINE_IN,
            restaurantId: restaurant.id,
            branchId: branch.id,
          },
        });

        // MenuSections + MenuItems per category — createMany avoids N individual round-trips
        await Promise.all(
          createdCategories.map(async (category, index) => {
            const section = await tx.menuSection.create({
              data: {
                name: category.name,
                order: index,
                menuId: menu.id,
              },
            });

            const productIds = categoryProductMap.get(category.id) ?? [];
            await tx.menuItem.createMany({
              data: productIds.map((productId, order) => ({
                menuSectionId: section.id,
                productId,
                order,
              })),
            });
          })
        );
      },
      { timeout: 30000, maxWait: 10000 }
    );
  } catch (err) {
    console.error("Error creating restaurant during registration:", err);
    return { success: false, error: "Ocurrió un error al crear tu cuenta. Intentá nuevamente." };
  }

  // 6. Auto-login — throws NEXT_REDIRECT, which must be re-thrown
  try {
    await signIn("credentials", {
      username: adminEmail,
      password,
      redirectTo: "/auth/callback",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Cuenta creada, pero hubo un error al iniciar sesión. Ingresá manualmente." };
    }
    throw error; // Re-throw NEXT_REDIRECT
  }

  // Unreachable — redirect fires above
  return { success: true, data: { slug } };
}

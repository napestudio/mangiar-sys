import { hash } from "@node-rs/bcrypt";
import {
  PrismaClient,
  UserRole,
  PriceType,
  UnitType,
  WeightUnit,
  VolumeUnit,
} from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ProductSeed = {
  id: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  unitType: UnitType;
  weightUnit?: WeightUnit;
  volumeUnit?: VolumeUnit;
  prices: { dineIn: number; takeAway: number; delivery: number };
  stock: number;
  minStock: number;
  maxStock: number;
  minStockAlert: number;
  trackStock: boolean;
};

async function seedProducts(
  products: ProductSeed[],
  restaurantId: string,
  branchId: string,
  adminUserId: string
) {
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { id: productData.id },
      update: {},
      create: {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        categoryId: productData.categoryId,
        restaurantId,
        unitType: productData.unitType,
        weightUnit: productData.weightUnit ?? null,
        volumeUnit: productData.volumeUnit ?? null,
        minStockAlert: productData.minStockAlert,
        trackStock: productData.trackStock,
        isActive: true,
      },
    });

    const productOnBranch = await prisma.productOnBranch.upsert({
      where: { productId_branchId: { productId: product.id, branchId } },
      update: {},
      create: {
        productId: product.id,
        branchId,
        stock: productData.stock,
        minStock: productData.minStock,
        maxStock: productData.maxStock,
        isActive: true,
        prices: {
          create: [
            { type: PriceType.DINE_IN, price: productData.prices.dineIn },
            { type: PriceType.TAKE_AWAY, price: productData.prices.takeAway },
            { type: PriceType.DELIVERY, price: productData.prices.delivery },
          ],
        },
      },
    });

    if (productData.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productOnBranchId: productOnBranch.id,
          quantity: productData.stock,
          previousStock: 0,
          newStock: productData.stock,
          reason: "Stock inicial",
          notes: "Carga inicial de inventario durante seed",
          createdBy: adminUserId,
        },
      });
    }
  }
}

async function seedTablesAndSlots(branchId: string) {
  const sector = await prisma.sector.upsert({
    where: { id: `sector-${branchId}` },
    update: {},
    create: {
      id: `sector-${branchId}`,
      name: "Salón Principal",
      color: "#3b82f6",
      order: 1,
      width: 1200,
      height: 800,
      branchId,
      isActive: true,
    },
  });

  for (let i = 1; i <= 9; i++) {
    const row = Math.floor((i - 1) / 3);
    const col = (i - 1) % 3;
    await prisma.table.upsert({
      where: { id: `table-${branchId}-${i}` },
      update: {},
      create: {
        id: `table-${branchId}-${i}`,
        number: i,
        capacity: 4,
        branchId,
        sectorId: sector.id,
        isActive: true,
        positionX: 100 + col * 200,
        positionY: 100 + row * 200,
        width: 100,
        height: 100,
        shape: "SQUARE",
        rotation: 0,
      },
    });
  }

  const allTables = await prisma.table.findMany({
    where: { branchId },
    select: { id: true, number: true, capacity: true },
  });
  const totalCapacity = allTables.reduce((s, t) => s + t.capacity, 0);
  const tableIds = allTables.map((t) => t.id);
  const ref = new Date("1970-01-01");

  for (const [name, startH, endH] of [
    ["Almuerzo", 12, 13],
    ["Cena", 20, 21],
  ] as [string, number, number][]) {
    const startTime = new Date(ref);
    startTime.setHours(startH, 0);
    const endTime = new Date(ref);
    endTime.setHours(endH, 0);

    const slotId = `slot-${branchId}-${startH}`;
    await prisma.timeSlot.upsert({
      where: { id: slotId },
      update: {},
      create: {
        id: slotId,
        name,
        startTime,
        endTime,
        daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        pricePerPerson: 0,
        capacity: totalCapacity,
        isActive: true,
        branchId,
        tables: { create: tableIds.map((tableId) => ({ tableId })) },
      },
    });
  }

  console.log("  ✓ 9 mesas y 2 turnos creados");
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  const adminPassword = await hash("Admin@123", 10);

  // ══════════════════════════════════════════════
  // 1. LA TORTILLERÍA
  // ══════════════════════════════════════════════
  console.log("☕ Creando La Tortillería...");

  const tortRestaurant = await prisma.restaurant.upsert({
    where: { id: "rest-tortilleria" },
    update: {},
    create: {
      id: "rest-tortilleria",
      name: "La Tortillería",
      slug: "la-tortilleria",
      description: "Café de especialidad y sándwiches artesanales",
      phone: "+54 351 4567890",
      isActive: true,
      address: "San Martín 432",
      city: "Córdoba",
      state: "Córdoba",
      postalCode: "5000",
      country: "Argentina",
    },
  });

  const tortBranch = await prisma.branch.upsert({
    where: { id: "branch-tortilleria" },
    update: {},
    create: {
      id: "branch-tortilleria",
      name: "La Tortillería - Córdoba Centro",
      slug: "la-tortilleria",
      address: "San Martín 432, Córdoba",
      restaurantId: tortRestaurant.id,
    },
  });

  const tortAdmin = await prisma.user.upsert({
    where: { username: "admin.tortilleria" },
    update: {},
    create: {
      username: "admin.tortilleria",
      email: "admin@latortilleria.com",
      name: "Administrador La Tortillería",
      password: adminPassword,
      userOnBranches: { create: { branchId: tortBranch.id, role: UserRole.ADMIN } },
    },
  });

  // Categorías
  await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-tort-cafeteria" },
      update: {},
      create: { id: "cat-tort-cafeteria", name: "Cafetería", order: 1, restaurantId: tortRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-tort-sandwiches" },
      update: {},
      create: { id: "cat-tort-sandwiches", name: "Sándwiches", order: 2, restaurantId: tortRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-tort-pasteleria" },
      update: {},
      create: { id: "cat-tort-pasteleria", name: "Pastelería", order: 3, restaurantId: tortRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-tort-bebidas" },
      update: {},
      create: { id: "cat-tort-bebidas", name: "Bebidas Frías", order: 4, restaurantId: tortRestaurant.id },
    }),
  ]);

  const tortProducts: ProductSeed[] = [
    {
      id: "prod-tort-americano",
      name: "Café Americano",
      description: "Café negro de especialidad, tostado medio",
      sku: "TORT-CAF-001",
      categoryId: "cat-tort-cafeteria",
      unitType: "UNIT",
      prices: { dineIn: 800, takeAway: 750, delivery: 850 },
      stock: 0,
      minStock: 0,
      maxStock: 0,
      minStockAlert: 0,
      trackStock: false,
    },
    {
      id: "prod-tort-cafe-leche",
      name: "Café con Leche",
      description: "Café espresso con leche vaporizada",
      sku: "TORT-CAF-002",
      categoryId: "cat-tort-cafeteria",
      unitType: "UNIT",
      prices: { dineIn: 950, takeAway: 900, delivery: 1000 },
      stock: 0,
      minStock: 0,
      maxStock: 0,
      minStockAlert: 0,
      trackStock: false,
    },
    {
      id: "prod-tort-cappuccino",
      name: "Cappuccino",
      description: "Espresso con espuma de leche y cacao en polvo",
      sku: "TORT-CAF-003",
      categoryId: "cat-tort-cafeteria",
      unitType: "UNIT",
      prices: { dineIn: 1100, takeAway: 1000, delivery: 1150 },
      stock: 0,
      minStock: 0,
      maxStock: 0,
      minStockAlert: 0,
      trackStock: false,
    },
    {
      id: "prod-tort-medialunas",
      name: "Medialunas (x3)",
      description: "Medialunas de manteca recién horneadas, glaseadas",
      sku: "TORT-PAS-001",
      categoryId: "cat-tort-pasteleria",
      unitType: "UNIT",
      prices: { dineIn: 600, takeAway: 550, delivery: 650 },
      stock: 60,
      minStock: 20,
      maxStock: 120,
      minStockAlert: 25,
      trackStock: true,
    },
    {
      id: "prod-tort-tostado",
      name: "Tostado de Jamón y Queso",
      description: "Pan brioche tostado con jamón cocido y queso gruyère derretido",
      sku: "TORT-SAN-001",
      categoryId: "cat-tort-sandwiches",
      unitType: "UNIT",
      prices: { dineIn: 1800, takeAway: 1700, delivery: 1900 },
      stock: 30,
      minStock: 10,
      maxStock: 60,
      minStockAlert: 12,
      trackStock: true,
    },
    {
      id: "prod-tort-sandwich-pollo",
      name: "Sándwich de Pollo y Palta",
      description: "Pollo a la plancha, palta, tomate y mayonesa de limón en pan artesanal",
      sku: "TORT-SAN-002",
      categoryId: "cat-tort-sandwiches",
      unitType: "UNIT",
      prices: { dineIn: 2200, takeAway: 2100, delivery: 2300 },
      stock: 25,
      minStock: 8,
      maxStock: 50,
      minStockAlert: 10,
      trackStock: true,
    },
    {
      id: "prod-tort-sandwich-veggie",
      name: "Sándwich Veggie",
      description: "Rúcula, mozzarella fresca, tomate asado y hummus en pan de campo",
      sku: "TORT-SAN-003",
      categoryId: "cat-tort-sandwiches",
      unitType: "UNIT",
      prices: { dineIn: 1900, takeAway: 1800, delivery: 2000 },
      stock: 20,
      minStock: 8,
      maxStock: 40,
      minStockAlert: 10,
      trackStock: true,
    },
    {
      id: "prod-tort-croissant",
      name: "Croissant de Manteca",
      description: "Croissant francés hojaldrado, elaborado con manteca premium",
      sku: "TORT-PAS-002",
      categoryId: "cat-tort-pasteleria",
      unitType: "UNIT",
      prices: { dineIn: 750, takeAway: 700, delivery: 800 },
      stock: 40,
      minStock: 15,
      maxStock: 80,
      minStockAlert: 18,
      trackStock: true,
    },
    {
      id: "prod-tort-jugo",
      name: "Jugo de Naranja Natural",
      description: "Jugo exprimido al momento con naranjas de estación",
      sku: "TORT-BEB-001",
      categoryId: "cat-tort-bebidas",
      unitType: "VOLUME",
      volumeUnit: "LITER",
      prices: { dineIn: 950, takeAway: 900, delivery: 1000 },
      stock: 10,
      minStock: 3,
      maxStock: 20,
      minStockAlert: 4,
      trackStock: true,
    },
    {
      id: "prod-tort-brownie",
      name: "Brownie de Chocolate",
      description: "Brownie húmedo de chocolate amargo con nueces, servido tibio",
      sku: "TORT-PAS-003",
      categoryId: "cat-tort-pasteleria",
      unitType: "UNIT",
      prices: { dineIn: 850, takeAway: 800, delivery: 900 },
      stock: 35,
      minStock: 12,
      maxStock: 70,
      minStockAlert: 15,
      trackStock: true,
    },
  ];

  await seedProducts(tortProducts, tortRestaurant.id, tortBranch.id, tortAdmin.id);
  console.log(`  ✓ ${tortProducts.length} productos creados`);

  await seedTablesAndSlots(tortBranch.id);

  // Menú principal
  const tortMenu = await prisma.menu.upsert({
    where: { id: "menu-tort-principal" },
    update: {},
    create: {
      id: "menu-tort-principal",
      name: "Carta",
      slug: "carta-tortilleria",
      description: "Nuestra selección de cafés, sándwiches y pastelería",
      restaurantId: tortRestaurant.id,
      branchId: tortBranch.id,
      isActive: true,
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    },
  });

  const tortSecCafe = await prisma.menuSection.create({
    data: { menuId: tortMenu.id, name: "Cafetería", order: 1 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: tortSecCafe.id, productId: "prod-tort-americano", order: 1, isAvailable: true, isFeatured: false },
      { menuSectionId: tortSecCafe.id, productId: "prod-tort-cafe-leche", order: 2, isAvailable: true, isFeatured: true },
      { menuSectionId: tortSecCafe.id, productId: "prod-tort-cappuccino", order: 3, isAvailable: true, isFeatured: false },
    ],
  });

  const tortSecSan = await prisma.menuSection.create({
    data: { menuId: tortMenu.id, name: "Sándwiches", order: 2 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: tortSecSan.id, productId: "prod-tort-tostado", order: 1, isAvailable: true, isFeatured: true },
      { menuSectionId: tortSecSan.id, productId: "prod-tort-sandwich-pollo", order: 2, isAvailable: true, isFeatured: true },
      { menuSectionId: tortSecSan.id, productId: "prod-tort-sandwich-veggie", order: 3, isAvailable: true, isFeatured: false },
    ],
  });

  const tortSecPas = await prisma.menuSection.create({
    data: { menuId: tortMenu.id, name: "Pastelería", order: 3 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: tortSecPas.id, productId: "prod-tort-medialunas", order: 1, isAvailable: true, isFeatured: true },
      { menuSectionId: tortSecPas.id, productId: "prod-tort-croissant", order: 2, isAvailable: true, isFeatured: false },
      { menuSectionId: tortSecPas.id, productId: "prod-tort-brownie", order: 3, isAvailable: true, isFeatured: true },
    ],
  });

  const tortSecBeb = await prisma.menuSection.create({
    data: { menuId: tortMenu.id, name: "Bebidas Frías", order: 4 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: tortSecBeb.id, productId: "prod-tort-jugo", order: 1, isAvailable: true, isFeatured: false },
    ],
  });

  console.log("  ✓ Menú y secciones creados");
  console.log("✅ La Tortillería lista\n");

  // ══════════════════════════════════════════════
  // 2. DON ATILIO
  // ══════════════════════════════════════════════
  console.log("🐟 Creando Don Atilio...");

  const atilioRestaurant = await prisma.restaurant.upsert({
    where: { id: "rest-donatilio" },
    update: {},
    create: {
      id: "rest-donatilio",
      name: "Don Atilio",
      slug: "don-atilio",
      description: "Restaurante de pescados y mariscos frescos del día",
      phone: "+54 11 4321-5678",
      isActive: true,
      address: "Av. Costanera Sur 1200",
      city: "Buenos Aires",
      state: "Buenos Aires",
      postalCode: "1107",
      country: "Argentina",
    },
  });

  const atilioBranch = await prisma.branch.upsert({
    where: { id: "branch-donatilio" },
    update: {},
    create: {
      id: "branch-donatilio",
      name: "Don Atilio - Costanera",
      slug: "don-atilio",
      address: "Av. Costanera Sur 1200, Buenos Aires",
      restaurantId: atilioRestaurant.id,
    },
  });

  const atilioAdmin = await prisma.user.upsert({
    where: { username: "admin.donatilio" },
    update: {},
    create: {
      username: "admin.donatilio",
      email: "admin@donatilio.com",
      name: "Administrador Don Atilio",
      password: adminPassword,
      userOnBranches: { create: { branchId: atilioBranch.id, role: UserRole.ADMIN } },
    },
  });

  // Categorías
  await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-dat-entradas" },
      update: {},
      create: { id: "cat-dat-entradas", name: "Entradas del Mar", order: 1, restaurantId: atilioRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-dat-pescados" },
      update: {},
      create: { id: "cat-dat-pescados", name: "Pescados", order: 2, restaurantId: atilioRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-dat-mariscos" },
      update: {},
      create: { id: "cat-dat-mariscos", name: "Mariscos", order: 3, restaurantId: atilioRestaurant.id },
    }),
    prisma.category.upsert({
      where: { id: "cat-dat-bebidas" },
      update: {},
      create: { id: "cat-dat-bebidas", name: "Bebidas", order: 4, restaurantId: atilioRestaurant.id },
    }),
  ]);

  const atilioProducts: ProductSeed[] = [
    {
      id: "prod-dat-ceviche",
      name: "Ceviche de Corvina",
      description: "Corvina fresca marinada en limón, cebolla morada, ají y cilantro",
      sku: "DAT-ENT-001",
      categoryId: "cat-dat-entradas",
      unitType: "UNIT",
      prices: { dineIn: 3800, takeAway: 3600, delivery: 4000 },
      stock: 20,
      minStock: 5,
      maxStock: 40,
      minStockAlert: 7,
      trackStock: true,
    },
    {
      id: "prod-dat-calamares",
      name: "Calamares Fritos",
      description: "Anillos de calamar rebozados con harina de maíz, servidos con alioli",
      sku: "DAT-ENT-002",
      categoryId: "cat-dat-entradas",
      unitType: "UNIT",
      prices: { dineIn: 3000, takeAway: 2800, delivery: 3200 },
      stock: 25,
      minStock: 8,
      maxStock: 50,
      minStockAlert: 10,
      trackStock: true,
    },
    {
      id: "prod-dat-ensalada-mar",
      name: "Ensalada del Mar",
      description: "Mezcla de mariscos cocidos, rúcula, cherry y vinagreta de maracuyá",
      sku: "DAT-ENT-003",
      categoryId: "cat-dat-entradas",
      unitType: "UNIT",
      prices: { dineIn: 2800, takeAway: 2700, delivery: 2900 },
      stock: 15,
      minStock: 5,
      maxStock: 30,
      minStockAlert: 6,
      trackStock: true,
    },
    {
      id: "prod-dat-merluza",
      name: "Filet de Merluza a la Plancha",
      description: "Filet de merluza patagónica con manteca de hierbas y papas rústicas",
      sku: "DAT-PES-001",
      categoryId: "cat-dat-pescados",
      unitType: "WEIGHT",
      weightUnit: "KILOGRAM",
      prices: { dineIn: 3500, takeAway: 3300, delivery: 3700 },
      stock: 8,
      minStock: 2,
      maxStock: 15,
      minStockAlert: 3,
      trackStock: true,
    },
    {
      id: "prod-dat-brotola",
      name: "Brótola a la Romana",
      description: "Brótola enharinada y frita, con salsa criolla y ensalada",
      sku: "DAT-PES-002",
      categoryId: "cat-dat-pescados",
      unitType: "WEIGHT",
      weightUnit: "KILOGRAM",
      prices: { dineIn: 3200, takeAway: 3000, delivery: 3400 },
      stock: 6,
      minStock: 2,
      maxStock: 12,
      minStockAlert: 3,
      trackStock: true,
    },
    {
      id: "prod-dat-salmon",
      name: "Salmón a la Plancha",
      description: "Salmón rosado con reducción de maracuyá, espárragos y arroz integral",
      sku: "DAT-PES-003",
      categoryId: "cat-dat-pescados",
      unitType: "WEIGHT",
      weightUnit: "KILOGRAM",
      prices: { dineIn: 5500, takeAway: 5200, delivery: 5800 },
      stock: 5,
      minStock: 1,
      maxStock: 10,
      minStockAlert: 2,
      trackStock: true,
    },
    {
      id: "prod-dat-langostinos",
      name: "Langostinos al Ajillo",
      description: "Langostinos salteados con ajo, manteca, vino blanco y perejil fresco",
      sku: "DAT-MAR-001",
      categoryId: "cat-dat-mariscos",
      unitType: "UNIT",
      prices: { dineIn: 4500, takeAway: 4300, delivery: 4700 },
      stock: 30,
      minStock: 10,
      maxStock: 60,
      minStockAlert: 12,
      trackStock: true,
    },
    {
      id: "prod-dat-parrillada",
      name: "Parrillada de Mariscos",
      description: "Langostinos, calamares, mejillones y pulpo a la parrilla con chimichurri marino",
      sku: "DAT-MAR-002",
      categoryId: "cat-dat-mariscos",
      unitType: "UNIT",
      prices: { dineIn: 8500, takeAway: 8200, delivery: 8800 },
      stock: 15,
      minStock: 3,
      maxStock: 30,
      minStockAlert: 5,
      trackStock: true,
    },
    {
      id: "prod-dat-cazuela",
      name: "Cazuela de Mariscos",
      description: "Cazuela caldosa con mejillones, almejas, langostinos y papas al azafrán",
      sku: "DAT-MAR-003",
      categoryId: "cat-dat-mariscos",
      unitType: "UNIT",
      prices: { dineIn: 5500, takeAway: 5200, delivery: 5800 },
      stock: 12,
      minStock: 4,
      maxStock: 25,
      minStockAlert: 5,
      trackStock: true,
    },
    {
      id: "prod-dat-vino-blanco",
      name: "Vino Blanco de la Casa",
      description: "Torrontés mendocino, fresco y afrutado, ideal para acompañar pescados",
      sku: "DAT-BEB-001",
      categoryId: "cat-dat-bebidas",
      unitType: "VOLUME",
      volumeUnit: "LITER",
      prices: { dineIn: 2500, takeAway: 2300, delivery: 2700 },
      stock: 20,
      minStock: 6,
      maxStock: 40,
      minStockAlert: 8,
      trackStock: true,
    },
  ];

  await seedProducts(atilioProducts, atilioRestaurant.id, atilioBranch.id, atilioAdmin.id);
  console.log(`  ✓ ${atilioProducts.length} productos creados`);

  await seedTablesAndSlots(atilioBranch.id);

  // Menú principal
  const atilioMenu = await prisma.menu.upsert({
    where: { id: "menu-dat-principal" },
    update: {},
    create: {
      id: "menu-dat-principal",
      name: "Carta Don Atilio",
      slug: "carta-don-atilio",
      description: "Pescados y mariscos frescos del día",
      restaurantId: atilioRestaurant.id,
      branchId: atilioBranch.id,
      isActive: true,
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    },
  });

  const atilioSecEnt = await prisma.menuSection.create({
    data: { menuId: atilioMenu.id, name: "Entradas del Mar", order: 1 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: atilioSecEnt.id, productId: "prod-dat-ceviche", order: 1, isAvailable: true, isFeatured: true },
      { menuSectionId: atilioSecEnt.id, productId: "prod-dat-calamares", order: 2, isAvailable: true, isFeatured: false },
      { menuSectionId: atilioSecEnt.id, productId: "prod-dat-ensalada-mar", order: 3, isAvailable: true, isFeatured: false },
    ],
  });

  const atilioSecPes = await prisma.menuSection.create({
    data: { menuId: atilioMenu.id, name: "Pescados", order: 2 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: atilioSecPes.id, productId: "prod-dat-merluza", order: 1, isAvailable: true, isFeatured: false },
      { menuSectionId: atilioSecPes.id, productId: "prod-dat-brotola", order: 2, isAvailable: true, isFeatured: false },
      { menuSectionId: atilioSecPes.id, productId: "prod-dat-salmon", order: 3, isAvailable: true, isFeatured: true },
    ],
  });

  const atilioSecMar = await prisma.menuSection.create({
    data: { menuId: atilioMenu.id, name: "Mariscos", order: 3 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: atilioSecMar.id, productId: "prod-dat-langostinos", order: 1, isAvailable: true, isFeatured: true },
      { menuSectionId: atilioSecMar.id, productId: "prod-dat-parrillada", order: 2, isAvailable: true, isFeatured: true },
      { menuSectionId: atilioSecMar.id, productId: "prod-dat-cazuela", order: 3, isAvailable: true, isFeatured: false },
    ],
  });

  const atilioSecBeb = await prisma.menuSection.create({
    data: { menuId: atilioMenu.id, name: "Bebidas", order: 4 },
  });
  await prisma.menuItem.createMany({
    data: [
      { menuSectionId: atilioSecBeb.id, productId: "prod-dat-vino-blanco", order: 1, isAvailable: true, isFeatured: true },
    ],
  });

  console.log("  ✓ Menú y secciones creados");
  console.log("✅ Don Atilio listo\n");

  // ══════════════════════════════════════════════
  // RESUMEN
  // ══════════════════════════════════════════════
  console.log("🎉 ¡Base de datos poblada exitosamente!\n");
  console.log("📝 Credenciales de Acceso:");
  console.log("─────────────────────────────────────────");
  console.log("☕ La Tortillería");
  console.log("   Email:    admin@latortilleria.com");
  console.log("   Username: admin.tortilleria");
  console.log("   Password: Admin@123");
  console.log("   Subdominio público: la-tortilleria");
  console.log("");
  console.log("🐟 Don Atilio");
  console.log("   Email:    admin@donatilio.com");
  console.log("   Username: admin.donatilio");
  console.log("   Password: Admin@123");
  console.log("   Subdominio público: don-atilio");
  console.log("─────────────────────────────────────────\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error durante el seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

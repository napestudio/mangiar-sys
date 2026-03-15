import { PrismaClient } from "@/app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "server-only";

declare global {
  // Allow global var reuse in dev mode
  var prisma: PrismaClient | undefined;
}

if (!global.prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  global.prisma = new PrismaClient({ adapter });
}

export const prisma = global.prisma;

// Export with proper index signature for PrismaAdapter compatibility
export default prisma as PrismaClient & { [key: string]: unknown };

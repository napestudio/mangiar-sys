import { PrismaClient } from "@/app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "server-only";

declare global {
  // Allow global var reuse in dev mode
  var prisma: PrismaClient | undefined;
}

if (!global.prisma) {
  // Vercel serverless: each Lambda is an isolated process, so max:10 would open
  // N×10 connections under concurrent load, exhausting PostgreSQL's connection limit.
  // Use max:1 in serverless (one connection per function instance is sufficient)
  // and max:5 in local dev (persistent process, shared pool).
  const isServerless = !!process.env.VERCEL;
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: isServerless ? 1 : 5,
  });
  global.prisma = new PrismaClient({ adapter });
}

export const prisma = global.prisma;

// Export with proper index signature for PrismaAdapter compatibility
export default prisma as PrismaClient & { [key: string]: unknown };

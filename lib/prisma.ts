import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const shouldLogPrismaErrors = process.env.PRISMA_LOG_ERRORS === "true";

  return new PrismaClient({
    log: shouldLogPrismaErrors ? ["error"] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Wrap a Prisma query with automatic retry on connection-termination errors (Neon idle timeout). */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isConnectionError =
        msg.includes("terminating connection") ||
        msg.includes("Connection refused") ||
        msg.includes("ECONNRESET") ||
        msg.includes("57P01") ||
        msg.includes("server closed the connection unexpectedly") ||
        msg.includes("connection terminated") ||
        msg.includes("P1017");

      if (isConnectionError && attempt < retries) {
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

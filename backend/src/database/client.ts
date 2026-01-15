import { PrismaClient } from "@prisma/client";

/**
 * Centralized Prisma client singleton.
 * Using this ensures only one client is instantiated, preventing connection pool exhaustion
 * and ensuring consistent configuration across the entire backend.
 */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;

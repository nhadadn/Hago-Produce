import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';

console.log('Integration Test DB URL (Initial):', process.env.DATABASE_URL);

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || !dbUrl.includes('5434')) {
  console.warn(`WARNING: Invalid DATABASE_URL for integration tests: ${dbUrl}. Forcing use of port 5434.`);
  dbUrl = "postgresql://postgres:password@localhost:5434/hagoproduce_test?schema=public";
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

export const resetDb = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    } catch (error) {
      logger.debug('Error resetting database', error);
    }
  }
};

export default prisma;

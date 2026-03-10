/**
 * Backfill: genera usernames para usuarios CUSTOMER que no tienen uno asignado.
 * Ejecutar con: npx tsx scripts/backfill-customer-usernames.ts
 */
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

function generateUsernameBase(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || 'cliente';
}

async function buildUniqueUsername(name: string, excludeUserId: string): Promise<string> {
  const base = generateUsernameBase(name);
  let candidate = base;
  let attempt = 1;
  while (
    await prisma.user.findFirst({
      where: { username: candidate, id: { not: excludeUserId } },
    })
  ) {
    candidate = `${base}${attempt}`;
    attempt++;
  }
  return candidate;
}

async function main() {
  const usersWithoutUsername = await prisma.user.findMany({
    where: { role: Role.CUSTOMER, username: null },
    include: { customer: true },
  });

  console.log(`Found ${usersWithoutUsername.length} CUSTOMER users without username.`);

  let updated = 0;
  for (const user of usersWithoutUsername) {
    const name = user.customer?.name || user.firstName || user.email.split('@')[0];
    const username = await buildUniqueUsername(name, user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    console.log(`  ✓ ${user.email} → username: ${username}`);
    updated++;
  }

  console.log(`\nDone. ${updated} users updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

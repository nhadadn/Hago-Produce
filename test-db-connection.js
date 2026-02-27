const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:password@localhost:5434/hagoproduce_test?schema=public',
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('Successfully connected to the database!');
    
    // Try a simple query
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);

  } catch (e) {
    console.error('Connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

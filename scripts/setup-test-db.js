const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Load .env.test
const envPath = path.resolve(process.cwd(), '.env.test');
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.error('Error loading .env.test:', result.error);
  process.exit(1);
}

const prisma = new PrismaClient();

async function waitForDb() {
  console.log('Waiting for database connection...');
  let retries = 10;
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully.');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.error(`Connection failed: ${error.message}`);
      console.log(`Connection failed, retrying... (${retries} attempts left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function main() {
  const connected = await waitForDb();
  if (!connected) {
    console.error('Could not connect to test database.');
    process.exit(1);
  }

  try {
    console.log('Pushing schema to test database...');
    // Use npx prisma db push --accept-data-loss
    // Need to pass environment explicitly to execSync
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    console.log('Schema pushed successfully.');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

main();

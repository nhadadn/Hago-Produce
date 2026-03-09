
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Check existing formats
  console.log("--- Customer Phone Samples ---");
  const customers = await prisma.customer.findMany({
    where: { phone: { not: null } },
    select: { phone: true },
    take: 3
  });
  console.table(customers);

  console.log("\n--- User Phone Samples ---");
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { phone: true },
    take: 3
  });
  console.table(users);

  // 2. Update Admin Phone
  const myPhone = '+15578659154'; // Your number
  
  console.log(`\n--- Updating Admin Phone to ${myPhone} ---`);
  
  try {
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    });

    if (!admin) {
      console.error("❌ No active ADMIN user found.");
      return;
    }

    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { phone: myPhone }
    });

    console.log(`✅ Success! Updated user ${updated.email} with phone ${updated.phone}`);
    
  } catch (error) {
    console.error("❌ Error updating admin phone:", error);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

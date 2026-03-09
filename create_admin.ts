
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newAdminPhone = '+16475693583';
  const newAdminEmail = 'admin2@hagoproduce.com'; // Using a placeholder email
  const newAdminPassword = 'securePassword123!';

  console.log(`🔍 Checking if user with phone ${newAdminPhone} already exists...`);

  try {
    const existingUser = await prisma.user.findFirst({
      where: { phone: newAdminPhone }
    });

    if (existingUser) {
      console.log(`⚠️ User with phone ${newAdminPhone} already exists.`);
      console.log(`   Email: ${existingUser.email}, Role: ${existingUser.role}`);
      
      if (existingUser.role !== 'ADMIN') {
        console.log(`   Updating role to ADMIN...`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' }
        });
        console.log(`✅ Role updated.`);
      }
      return;
    }

    console.log(`Creating new ADMIN user...`);
    const hashedPassword = await hash(newAdminPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email: newAdminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Two',
        role: 'ADMIN',
        isActive: true,
        phone: newAdminPhone
      }
    });

    console.log(`🎉 Created new ADMIN user:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Phone: ${newUser.phone}`);
    console.log(`   Role: ${newUser.role}`);

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

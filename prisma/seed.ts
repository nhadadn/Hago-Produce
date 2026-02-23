import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@hagoproduce.com';
  const password = 'password123';
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`Created admin user: ${user.email}`);
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

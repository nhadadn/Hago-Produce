
import { PrismaClient } from '@prisma/client';

// Unmock the DB to use the real one
jest.unmock('@/lib/db');

// Import the real client (via requireActual or just import, since we unmocked)
// But wait, unmock applies to subsequent imports.
// And jest.setup.ts already imported/mocked it.
// So we might need to use requireActual.
const { default: prisma } = jest.requireActual('@/lib/db');

describe('Database Health Check (Integration)', () => {
  beforeAll(async () => {
    // Connect to the DB
    await prisma.$connect();
  });

  afterAll(async () => {
    // Disconnect
    await prisma.$disconnect();
  });

  it('should connect to the database and execute a query', async () => {
    // Execute a simple query
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].result).toBe(1);
  });

  it('should be able to create and retrieve a record (User)', async () => {
    // Create a user
    const email = `test-user-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        password: 'hashed-password-123',
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(email);

    // Retrieve the user
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(foundUser).toBeDefined();
    expect(foundUser?.id).toBe(user.id);

    // Clean up
    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});

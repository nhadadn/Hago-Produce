import { userService } from '@/lib/services/users.service';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.MANAGEMENT,
        isActive: true,
        createdAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          // password should be hashed, so not checking exact value
          firstName: 'Test',
          lastName: 'User',
        }),
      }));
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: Role.ADMIN },
        { id: '2', email: 'user2@example.com', role: Role.MANAGEMENT },
      ];
      const mockCount = 2;

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await userService.getUsers({ page: 1, limit: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should apply filters', async () => {
      const mockUsers = [{ id: '1', email: 'admin@example.com', role: Role.ADMIN }];
      
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await userService.getUsers({ role: Role.ADMIN, search: 'admin' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          role: Role.ADMIN,
          OR: expect.arrayContaining([
            { email: { contains: 'admin', mode: 'insensitive' } },
          ]),
        }),
      }));
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user (set isActive to false)', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: '1', isActive: false });

      await userService.deleteUser('1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });
});

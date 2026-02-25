import { userService } from '@/lib/services/users.service';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

// Mock hashPassword
jest.mock('@/lib/auth/password', () => ({
  hashPassword: jest.fn(),
}));

describe('UserService', () => {
  const mockPrisma = prisma as any;
  const mockHashPassword = hashPassword as jest.Mock;

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

      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('hashedPassword123');

      const result = await userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          password: 'hashedPassword123',
          firstName: 'Test',
          lastName: 'User',
          role: Role.MANAGEMENT, // Default role
        }),
        select: expect.any(Object),
      }));
      expect(result).toEqual(mockUser);
    });

    it('should create a user with specified role', async () => {
        const mockUser = {
          id: '1',
          email: 'admin@example.com',
          role: Role.ADMIN,
        };
  
        mockPrisma.user.create.mockResolvedValue(mockUser);
        mockHashPassword.mockResolvedValue('hashedPassword123');
  
        await userService.createUser({
          email: 'admin@example.com',
          password: 'password123',
          role: Role.ADMIN,
        });
  
        expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            role: Role.ADMIN,
          }),
        }));
      });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await userService.getUserById('999');
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user details without password', async () => {
      const mockUser = { id: '1', firstName: 'Updated' };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userService.updateUser('1', { firstName: 'Updated' });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: { firstName: 'Updated' },
        select: expect.any(Object),
      }));
      expect(result).toEqual(mockUser);
    });

    it('should update password if provided', async () => {
      const mockUser = { id: '1' };
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('newHashedPassword');

      await userService.updateUser('1', { password: 'newpassword' });

      expect(mockHashPassword).toHaveBeenCalledWith('newpassword');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({
          password: 'newHashedPassword',
        }),
      }));
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: '1', isActive: false });

      await userService.deleteUser('1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default params', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: Role.ADMIN },
        { id: '2', email: 'user2@example.com', role: Role.MANAGEMENT },
      ];
      const mockCount = 2;

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(mockCount);

      const result = await userService.getUsers({});

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
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

    it('should apply role filter', async () => {
        const mockUsers = [{ id: '1', email: 'admin@example.com', role: Role.ADMIN }];
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.count.mockResolvedValue(1);
  
        await userService.getUsers({ role: Role.ADMIN });
  
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            role: Role.ADMIN,
          }),
        }));
    });

    it('should apply isActive filter (true)', async () => {
        const mockUsers = [{ id: '1', isActive: true }];
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.count.mockResolvedValue(1);
  
        await userService.getUsers({ isActive: true });
  
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }));
    });

    it('should apply isActive filter (false)', async () => {
        const mockUsers = [{ id: '1', isActive: false }];
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.count.mockResolvedValue(1);
  
        await userService.getUsers({ isActive: false });
  
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        }));
    });

    it('should apply search filter', async () => {
      const mockUsers = [{ id: '1', email: 'admin@example.com' }];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      await userService.getUsers({ search: 'admin' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { contains: 'admin', mode: 'insensitive' } },
            { firstName: { contains: 'admin', mode: 'insensitive' } },
            { lastName: { contains: 'admin', mode: 'insensitive' } },
          ]),
        }),
      }));
    });
  });
});

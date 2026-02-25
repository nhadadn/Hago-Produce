
import { 
  createApiKey, 
  updateApiKey, 
  validateApiKey, 
  rotateApiKey, 
  revokeApiKey, 
  listApiKeys, 
  getApiKeyById,
  generateApiKey,
  BotApiKeyService
} from '@/lib/services/bot/api-key.service';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    botApiKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Bot API Key Service', () => {
  const mockDate = new Date('2024-01-01T00:00:00Z');
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateApiKey', () => {
    it('should generate a key starting with hk_prod_', async () => {
      const key = await generateApiKey();
      expect(key).toMatch(/^hk_prod_[a-f0-9]{32}$/);
    });
  });

  describe('createApiKey', () => {
    const mockData = {
      name: 'Test Key',
      description: 'Test Description',
    };

    it('should create a new api key successfully', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');
      
      const mockCreatedKey = {
        id: 'key-123',
        ...mockData,
        hashedKey: 'hashed_key',
        rateLimit: 60,
        isActive: true,
        createdAt: mockDate,
        lastUsedAt: null,
        expiresAt: null,
      };

      (prisma.botApiKey.create as jest.Mock).mockResolvedValue(mockCreatedKey);

      const result = await createApiKey(mockData);

      expect(prisma.botApiKey.findUnique).toHaveBeenCalledWith({ where: { name: mockData.name } });
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prisma.botApiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockData.name,
          hashedKey: 'hashed_key',
        }),
      });
      expect(result.apiKey).toMatch(/^hk_prod_/);
      expect(result.info.id).toBe('key-123');
    });

    it('should throw error if name already exists', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(createApiKey(mockData)).rejects.toThrow('Ya existe una API key con ese nombre');
    });
  });

  describe('updateApiKey', () => {
    const keyId = 'key-123';
    const updateData = { name: 'New Name' };

    it('should update api key successfully', async () => {
      (prisma.botApiKey.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: keyId, name: 'Old Name' }) // First check existence
        .mockResolvedValueOnce(null); // Second check name uniqueness (if needed)

      const mockUpdatedKey = {
        id: keyId,
        name: 'New Name',
        description: 'Desc',
        rateLimit: 60,
        isActive: true,
        createdAt: mockDate,
        lastUsedAt: null,
        expiresAt: null,
      };

      (prisma.botApiKey.update as jest.Mock).mockResolvedValue(mockUpdatedKey);

      const result = await updateApiKey(keyId, updateData);

      expect(prisma.botApiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: expect.objectContaining({ name: 'New Name' }),
      });
      expect(result.name).toBe('New Name');
    });

    it('should throw error if key not found', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateApiKey(keyId, updateData)).rejects.toThrow('API key no encontrada');
    });

    it('should throw error if new name already exists', async () => {
      (prisma.botApiKey.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: keyId, name: 'Old Name' }) // Exists
        .mockResolvedValueOnce({ id: 'other-key', name: 'New Name' }); // Name collision

      await expect(updateApiKey(keyId, updateData)).rejects.toThrow('Ya existe una API key con ese nombre');
    });
  });

  describe('validateApiKey', () => {
    const plainKey = 'hk_prod_test';
    const hashedKey = 'hashed_test';

    it('should return key info if valid', async () => {
      const mockKey = {
        id: 'key-123',
        name: 'Test',
        hashedKey: hashedKey,
        isActive: true,
        expiresAt: null,
      };

      (prisma.botApiKey.findMany as jest.Mock).mockResolvedValue([mockKey]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.botApiKey.update as jest.Mock).mockResolvedValue({});

      const result = await validateApiKey(plainKey);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('key-123');
      expect(prisma.botApiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null if invalid key', async () => {
      (prisma.botApiKey.findMany as jest.Mock).mockResolvedValue([{ hashedKey: 'other' }]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await validateApiKey(plainKey);

      expect(result).toBeNull();
    });

    it('should return null if key expired', async () => {
      const expiredKey = {
        id: 'key-123',
        hashedKey: hashedKey,
        isActive: true,
        expiresAt: new Date(mockDate.getTime() - 1000), // Expired
      };

      (prisma.botApiKey.findMany as jest.Mock).mockResolvedValue([expiredKey]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await validateApiKey(plainKey);

      expect(result).toBeNull();
    });
  });

  describe('rotateApiKey', () => {
    const keyId = 'key-123';

    it('should rotate key successfully', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue({ id: keyId });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_key');
      
      const mockUpdatedKey = {
        id: keyId,
        name: 'Test',
        description: 'Desc',
        rateLimit: 60,
        isActive: true,
        createdAt: mockDate,
        lastUsedAt: null,
        expiresAt: null,
        hashedKey: 'new_hashed_key',
      };

      (prisma.botApiKey.update as jest.Mock).mockResolvedValue(mockUpdatedKey);

      const result = await rotateApiKey(keyId);

      expect(result.apiKey).toMatch(/^hk_prod_/);
      expect(prisma.botApiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: expect.objectContaining({ hashedKey: 'new_hashed_key' }),
      });
    });

    it('should throw error if key not found', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rotateApiKey(keyId)).rejects.toThrow('API key no encontrada');
    });
  });

  describe('revokeApiKey', () => {
    const keyId = 'key-123';

    it('should revoke api key successfully', async () => {
      (prisma.botApiKey.update as jest.Mock).mockResolvedValue({
        id: keyId,
        isActive: false,
      });

      await revokeApiKey(keyId);

      expect(prisma.botApiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('listApiKeys', () => {
    it('should list all api keys with stats', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', createdAt: mockDate, description: null, rateLimit: 60, isActive: true, lastUsedAt: null, expiresAt: null },
        { id: 'key-2', name: 'Key 2', createdAt: mockDate, description: null, rateLimit: 60, isActive: true, lastUsedAt: null, expiresAt: null },
      ];

      (prisma.botApiKey.findMany as jest.Mock).mockResolvedValue(mockKeys);

      const result = await listApiKeys();

      expect(prisma.botApiKey.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('key-1');
      expect(result[0].requestCount).toBe(0); // Default placeholder
    });
  });

  describe('getApiKeyById', () => {
    const keyId = 'key-123';

    it('should return api key info if found', async () => {
      const mockKey = { 
        id: keyId, 
        name: 'Test Key',
        description: null,
        rateLimit: 60,
        isActive: true,
        createdAt: mockDate,
        lastUsedAt: null,
        expiresAt: null
      };
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue(mockKey);

      const result = await getApiKeyById(keyId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(keyId);
    });

    it('should return null if not found', async () => {
      (prisma.botApiKey.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getApiKeyById(keyId);

      expect(result).toBeNull();
    });
  });

  describe('BotApiKeyService Class Wrapper', () => {
    it('should expose static methods correctly', () => {
      expect(BotApiKeyService.generateApiKey).toBeDefined();
      expect(BotApiKeyService.create).toBeDefined();
      expect(BotApiKeyService.update).toBeDefined();
      expect(BotApiKeyService.validate).toBeDefined();
      expect(BotApiKeyService.rotate).toBeDefined();
      expect(BotApiKeyService.revoke).toBeDefined();
      expect(BotApiKeyService.list).toBeDefined();
      expect(BotApiKeyService.getById).toBeDefined();
    });

    it('should be instantiable (coverage only)', () => {
      const service = new BotApiKeyService();
      expect(service).toBeInstanceOf(BotApiKeyService);
    });
  });
});

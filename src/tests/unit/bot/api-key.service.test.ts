import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import prisma from '@/lib/db';
import {
  generateApiKey,
  createApiKey,
  validateApiKey,
  rotateApiKey,
  revokeApiKey,
  listApiKeys,
  BotApiKeyService,
} from '@/lib/services/bot/api-key.service';

const botApiKeys: any[] = [];
const webhookLogs: any[] = [];

function resetState() {
  botApiKeys.length = 0;
  webhookLogs.length = 0;
}

function setupPrismaMocks() {
  (prisma.botApiKey as any).deleteMany = jest.fn(async () => {
    botApiKeys.length = 0;
    return { count: 0 };
  });

  (prisma.botApiKey as any).findUnique = jest.fn(async ({ where }: any) => {
    if (where.id) {
      return botApiKeys.find(k => k.id === where.id) ?? null;
    }
    if (where.name) {
      return botApiKeys.find(k => k.name === where.name) ?? null;
    }
    return null;
  });

  (prisma.botApiKey as any).findMany = jest.fn(async ({ where, orderBy }: any = {}) => {
    let result = [...botApiKeys];
    if (where && typeof where.isActive === 'boolean') {
      result = result.filter(k => k.isActive === where.isActive);
    }
    if (orderBy && orderBy.createdAt === 'desc') {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return result;
  });

  (prisma.botApiKey as any).create = jest.fn(async ({ data }: any) => {
    const now = new Date();
    const record = {
      id: data.id ?? `id_${botApiKeys.length + 1}`,
      name: data.name,
      description: data.description ?? null,
      hashedKey: data.hashedKey,
      rateLimit: data.rateLimit ?? 60,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      expiresAt: data.expiresAt ?? null,
    };
    botApiKeys.push(record);
    return record;
  });

  (prisma.botApiKey as any).update = jest.fn(async ({ where, data }: any) => {
    const idx = botApiKeys.findIndex(k => k.id === where.id);
    if (idx === -1) {
      throw new Error('API key no encontrada');
    }
    botApiKeys[idx] = { ...botApiKeys[idx], ...data, updatedAt: new Date() };
    return botApiKeys[idx];
  });

  (prisma.webhookLog as any).createMany = jest.fn(async ({ data }: any) => {
    for (const item of data) {
      webhookLogs.push({ id: `log_${webhookLogs.length + 1}`, ...item });
    }
    return { count: data.length };
  });

  (prisma.webhookLog as any).count = jest.fn(async ({ where }: any) => {
    return webhookLogs.filter(log => {
      if (where && where.apiKey) {
        return log.apiKey === where.apiKey;
      }
      return true;
    }).length;
  });
}

describe('BotApiKeyService', () => {
  beforeEach(() => {
    resetState();
    setupPrismaMocks();
  });

  afterEach(() => {
    resetState();
    jest.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('debe generar API keys únicas con prefijo hk_prod_', async () => {
      const key1 = await generateApiKey();
      const key2 = await generateApiKey();

      expect(key1).toMatch(/^hk_prod_[0-9a-f]+$/);
      expect(key2).toMatch(/^hk_prod_[0-9a-f]+$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe('createApiKey', () => {
    it('debe crear una API key con valores por defecto', async () => {
      const { apiKey, info } = await createApiKey({ name: 'test-key' });

      expect(apiKey).toBeDefined();
      expect(apiKey).toMatch(/^hk_prod_[0-9a-f]+$/);
      expect(info.name).toBe('test-key');
      expect(info.rateLimit).toBe(60);
      expect(info.isActive).toBe(true);
      expect(info.requestCount).toBe(0);

      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'test-key' },
      });

      expect(saved).toBeDefined();
      expect(saved?.hashedKey).toBeDefined();
      expect(saved?.hashedKey).not.toBe(apiKey);
    });

    it('debe crear una API key con rate limit personalizado', async () => {
      const { apiKey, info } = await createApiKey({ name: 'custom-key', rateLimit: 120 });

      expect(apiKey).toBeDefined();
      expect(info.rateLimit).toBe(120);
    });

    it('debe rechazar nombres duplicados', async () => {
      await createApiKey({ name: 'duplicate-key' });

      await expect(createApiKey({ name: 'duplicate-key' })).rejects.toThrow(
        'Ya existe una API key con ese nombre'
      );
    });
  });

  describe('validateApiKey', () => {
    it('debe validar una API key correcta', async () => {
      const { apiKey } = await createApiKey({ name: 'valid-key' });
      const result = await validateApiKey(apiKey);

      expect(result).toBeDefined();
      expect(result?.name).toBe('valid-key');
      expect(result?.isActive).toBe(true);
      expect(result?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('debe rechazar una API key inválida', async () => {
      const result = await validateApiKey('invalid-key-12345');

      expect(result).toBeNull();
    });

    it('debe rechazar una API key revocada', async () => {
      const { apiKey, info } = await createApiKey({ name: 'revoked-key' });
      await revokeApiKey(info.id);

      const result = await validateApiKey(apiKey);
      expect(result).toBeNull();
    });
  });

  describe('rotateApiKey', () => {
    it('debe generar una nueva API key y actualizar el registro', async () => {
      const { apiKey: originalKey, info } = await createApiKey({ name: 'rotate-key' });

      const rotated = await rotateApiKey(info.id);

      expect(rotated.apiKey).toBeDefined();
      expect(rotated.apiKey).not.toBe(originalKey);

      const oldValidation = await validateApiKey(originalKey);
      expect(oldValidation).toBeNull();

      const newValidation = await validateApiKey(rotated.apiKey);
      expect(newValidation).toBeDefined();
      expect(newValidation?.id).toBe(info.id);
    });

    it('debe rechazar rotar una key inexistente', async () => {
      await expect(rotateApiKey('non-existent-id')).rejects.toThrow(
        'API key no encontrada'
      );
    });
  });

  describe('revokeApiKey', () => {
    it('debe desactivar una API key', async () => {
      const { info } = await createApiKey({ name: 'revoke-key' });

      await revokeApiKey(info.id);

      const revoked = await prisma.botApiKey.findUnique({
        where: { id: info.id },
      });

      expect(revoked?.isActive).toBe(false);
    });
  });

  describe('listApiKeys', () => {
    it('debe listar todas las API keys con estadísticas', async () => {
      await createApiKey({ name: 'key1', rateLimit: 30 });
      await createApiKey({ name: 'key2', rateLimit: 90 });

      const keys = await listApiKeys();

      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe('key2');
      expect(keys[1].name).toBe('key1');
      expect(keys.every(k => !('hashedKey' in k))).toBe(true);
    });
  });

  describe('BotApiKeyService (clase estática)', () => {
    it('debe exportar todos los métodos como estáticos', () => {
      expect(typeof BotApiKeyService.generateApiKey).toBe('function');
      expect(typeof BotApiKeyService.create).toBe('function');
      expect(typeof BotApiKeyService.update).toBe('function');
      expect(typeof BotApiKeyService.validate).toBe('function');
      expect(typeof BotApiKeyService.rotate).toBe('function');
      expect(typeof BotApiKeyService.revoke).toBe('function');
      expect(typeof BotApiKeyService.list).toBe('function');
      expect(typeof BotApiKeyService.getById).toBe('function');
    });

    it('los métodos estáticos deben funcionar igual que las funciones exportadas', async () => {
      const created = await BotApiKeyService.create({ name: 'static-test' });
      const direct = await createApiKey({ name: 'direct-test' });

      expect(created.apiKey).toBeDefined();
      expect(direct.apiKey).toBeDefined();

      const validation1 = await BotApiKeyService.validate(created.apiKey);
      const validation2 = await validateApiKey(direct.apiKey);

      expect(validation1).toBeDefined();
      expect(validation2).toBeDefined();
    });
  });

  describe('Seguridad', () => {
    it('debe hashear las API keys con bcrypt', async () => {
      const { apiKey } = await createApiKey({ name: 'hash-test' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'hash-test' },
      });

      expect(saved?.hashedKey).not.toBe(apiKey);
      expect(saved?.hashedKey).toMatch(/^\$2[aby]\$/);

      const isValidHash = await bcrypt.compare(apiKey, saved!.hashedKey);
      expect(isValidHash).toBe(true);
    });

    it('debe usar salt único para cada key', async () => {
      await createApiKey({ name: 'salt1' });
      await createApiKey({ name: 'salt2' });

      const saved1 = await prisma.botApiKey.findUnique({ where: { name: 'salt1' } });
      const saved2 = await prisma.botApiKey.findUnique({ where: { name: 'salt2' } });

      expect(saved1?.hashedKey).not.toBe(saved2?.hashedKey);
    });

    it('no debe exponer hashedKey en listApiKeys', async () => {
      await createApiKey({ name: 'expose-test' });

      const keys = await listApiKeys();
      const key = keys.find(k => k.name === 'expose-test');

      expect(key).toBeDefined();
      expect('hashedKey' in key!).toBe(false);
      expect('hashed_key' in key!).toBe(false);
    });
  });
});


import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import {
  generateApiKey,
  createApiKey,
  validateApiKey,
  rotateApiKey,
  revokeApiKey,
  listApiKeys,
  BotApiKeyService,
} from '@/lib/services/bot/api-key.service';

describe('BotApiKeyService', () => {
  beforeEach(async () => {
    // Limpiar tabla antes de cada test
    await prisma.botApiKey.deleteMany();
  });

  afterEach(async () => {
    // Limpiar después de cada test
    await prisma.botApiKey.deleteMany();
  });

  describe('generateApiKey', () => {
    it('debe generar una API key única con formato UUID-timestamp', async () => {
      const key1 = await generateApiKey();
      const key2 = await generateApiKey();

      expect(key1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{13}$/);
      expect(key2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{13}$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe('createApiKey', () => {
    it('debe crear una API key con valores por defecto', async () => {
      const plainKey = await createApiKey({ name: 'test-key' });

      expect(plainKey).toBeDefined();
      expect(plainKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{13}$/);

      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'test-key' },
      });

      expect(saved).toBeDefined();
      expect(saved?.rateLimit).toBe(60);
      expect(saved?.isActive).toBe(true);
      expect(saved?.hashedKey).toBeDefined();
      expect(saved?.hashedKey).not.toBe(plainKey); // Debe estar hasheada
    });

    it('debe crear una API key con rate limit personalizado', async () => {
      const plainKey = await createApiKey({ name: 'custom-key', rateLimit: 120 });

      expect(plainKey).toBeDefined();

      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'custom-key' },
      });

      expect(saved?.rateLimit).toBe(120);
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
      const plainKey = await createApiKey({ name: 'valid-key' });
      const result = await validateApiKey(plainKey);

      expect(result).toBeDefined();
      expect(result?.name).toBe('valid-key');
      expect(result?.isActive).toBe(true);
      expect(result?.lastUsedAt).toBeDefined(); // Debe haber sido actualizado
    });

    it('debe rechazar una API key inválida', async () => {
      const result = await validateApiKey('invalid-key-12345');

      expect(result).toBeNull();
    });

    it('debe rechazar una API key revocada', async () => {
      const plainKey = await createApiKey({ name: 'revoked-key' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'revoked-key' },
      });

      // Revocar la key
      await revokeApiKey(saved!.id);

      const result = await validateApiKey(plainKey);
      expect(result?.isActive).toBe(false);
    });

    it('debe actualizar lastUsedAt al validar', async () => {
      const plainKey = await createApiKey({ name: 'update-key' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'update-key' },
      });

      const initialLastUsed = saved?.lastUsedAt;

      // Esperar un momento para asegurar diferencia de tiempo
      await new Promise(resolve => setTimeout(resolve, 100));

      await validateApiKey(plainKey);

      const updated = await prisma.botApiKey.findUnique({
        where: { name: 'update-key' },
      });

      expect(updated?.lastUsedAt).not.toEqual(initialLastUsed);
      expect(updated?.lastUsedAt?.getTime()).toBeGreaterThan(
        initialLastUsed?.getTime() || 0
      );
    });
  });

  describe('rotateApiKey', () => {
    it('debe generar una nueva API key y actualizar el registro', async () => {
      const originalKey = await createApiKey({ name: 'rotate-key' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'rotate-key' },
      });

      const newKey = await rotateApiKey(saved!.id);

      expect(newKey).toBeDefined();
      expect(newKey).not.toBe(originalKey);
      expect(newKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{13}$/);

      // La vieja key ya no debe ser válida
      const oldValidation = await validateApiKey(originalKey);
      expect(oldValidation).toBeNull();

      // La nueva key debe ser válida
      const newValidation = await validateApiKey(newKey);
      expect(newValidation).toBeDefined();
      expect(newValidation?.name).toBe('rotate-key');
    });

    it('debe rechazar rotar una key inexistente', async () => {
      await expect(rotateApiKey('non-existent-id')).rejects.toThrow(
        'API key no encontrada'
      );
    });
  });

  describe('revokeApiKey', () => {
    it('debe desactivar una API key', async () => {
      const plainKey = await createApiKey({ name: 'revoke-key' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'revoke-key' },
      });

      await revokeApiKey(saved!.id);

      const revoked = await prisma.botApiKey.findUnique({
        where: { id: saved!.id },
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
      expect(keys[0].name).toBe('key2'); // Orden descendente por createdAt
      expect(keys[1].name).toBe('key1');
      expect(keys.every(k => !('hashedKey' in k))).toBe(true); // No debe exponer hashedKey
    });

    it('debe incluir requestCount basado en logs', async () => {
      const plainKey = await createApiKey({ name: 'count-key' });
      
      // Crear algunos logs simulados
      await prisma.webhookLog.createMany({
        data: [
          {
            source: 'bot',
            apiKey: plainKey,
            eventType: 'test.event',
            status: 'success',
            httpStatus: 200,
            createdAt: new Date(),
          },
          {
            source: 'bot',
            apiKey: plainKey,
            eventType: 'test.event2',
            status: 'success',
            httpStatus: 200,
            createdAt: new Date(),
          },
        ],
      });

      const keys = await listApiKeys();
      const ourKey = keys.find(k => k.name === 'count-key');

      expect(ourKey?.requestCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('BotApiKeyService (clase estática)', () => {
    it('debe exportar todos los métodos como estáticos', async () => {
      expect(typeof BotApiKeyService.generateApiKey).toBe('function');
      expect(typeof BotApiKeyService.create).toBe('function');
      expect(typeof BotApiKeyService.validate).toBe('function');
      expect(typeof BotApiKeyService.rotate).toBe('function');
      expect(typeof BotApiKeyService.revoke).toBe('function');
      expect(typeof BotApiKeyService.list).toBe('function');
    });

    it('los métodos estáticos deben funcionar igual que las funciones exportadas', async () => {
      const key1 = await BotApiKeyService.create({ name: 'static-test' });
      const key2 = await createApiKey({ name: 'direct-test' });

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();

      const validation1 = await BotApiKeyService.validate(key1);
      const validation2 = await validateApiKey(key2);

      expect(validation1).toBeDefined();
      expect(validation2).toBeDefined();
    });
  });

  describe('Seguridad', () => {
    it('debe hashear las API keys con bcrypt', async () => {
      const plainKey = await createApiKey({ name: 'hash-test' });
      const saved = await prisma.botApiKey.findUnique({
        where: { name: 'hash-test' },
      });

      expect(saved?.hashedKey).not.toBe(plainKey);
      expect(saved?.hashedKey).toMatch(/^\$2[aby]\$/); // Formato bcrypt

      // Verificar que el hash es válido
      const isValidHash = await bcrypt.compare(plainKey, saved!.hashedKey);
      expect(isValidHash).toBe(true);
    });

    it('debe usar salt único para cada key', async () => {
      const key1 = await createApiKey({ name: 'salt1' });
      const key2 = await createApiKey({ name: 'salt2' });

      const saved1 = await prisma.botApiKey.findUnique({ where: { name: 'salt1' } });
      const saved2 = await prisma.botApiKey.findUnique({ where: { name: 'salt2' } });

      expect(saved1?.hashedKey).not.toBe(saved2?.hashedKey);
    });

    it('no debe exponer hashedKey en listApiKeys', async () => {
      await createApiKey({ name: 'expose-test' });

      const keys = await listApiKeys();
      const key = keys[0];

      expect(key).toBeDefined();
      expect('hashedKey' in key).toBe(false);
      expect('hashed_key' in key).toBe(false);
    });
  });
});
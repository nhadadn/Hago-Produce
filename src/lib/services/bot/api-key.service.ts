import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface CreateApiKeyData {
  name: string;
  rateLimit?: number; // requests per minute
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
  requestCount: number;
}

/**
 * Genera una API key segura (UUID v4 + timestamp)
 * @returns API key en texto plano (solo se retorna una vez)
 */
export async function generateApiKey(): Promise<string> {
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}`;
}

/**
 * Crea una nueva API key y la guarda en la base de datos
 * @param data Datos de la API key
 * @returns API key en texto plano (solo se retorna una vez)
 */
export async function createApiKey(data: CreateApiKeyData): Promise<string> {
  // Validar que el nombre sea único
  const existing = await prisma.botApiKey.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error('Ya existe una API key con ese nombre');
  }

  const plainKey = await generateApiKey();
  const hashedKey = await bcrypt.hash(plainKey, 10);

  await prisma.botApiKey.create({
    data: {
      name: data.name,
      hashedKey,
      rateLimit: data.rateLimit ?? 60, // Default 60 requests/minute
      isActive: true,
    },
  });

  return plainKey; // Solo se retorna una vez
}

/**
 * Valida una API key y retorna su información si es válida
 * @param apiKey API key en texto plano
 * @returns Información de la API key o null si es inválida
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyInfo | null> {
  // Buscar todas las keys activas (no podemos buscar por hash directamente)
  const activeKeys = await prisma.botApiKey.findMany({
    where: { isActive: true },
  });

  // Buscar la key que coincida con el hash
  for (const key of activeKeys) {
    const isValid = await bcrypt.compare(apiKey, key.hashedKey);
    if (isValid) {
      // Actualizar lastUsedAt
      await prisma.botApiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() },
      });

      // Contar usos (buscar en WebhookLog o cualquier tabla de logs que uses)
      const requestCount = await prisma.webhookLog.count({
        where: {
          apiKey: apiKey,
          source: 'bot',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
          },
        },
      });

      return {
        id: key.id,
        name: key.name,
        rateLimit: key.rateLimit,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        requestCount,
      };
    }
  }

  return null;
}

/**
 * Rota una API key (genera una nueva y actualiza el registro)
 * @param id ID de la API key a rotar
 * @returns Nueva API key en texto plano
 */
export async function rotateApiKey(id: string): Promise<string> {
  const existing = await prisma.botApiKey.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('API key no encontrada');
  }

  const newPlainKey = await generateApiKey();
  const newHashedKey = await bcrypt.hash(newPlainKey, 10);

  await prisma.botApiKey.update({
    where: { id },
    data: {
      hashedKey: newHashedKey,
      updatedAt: new Date(),
    },
  });

  return newPlainKey; // Solo se retorna una vez
}

/**
 * Revoca una API key (la desactiva)
 * @param id ID de la API key a revocar
 */
export async function revokeApiKey(id: string): Promise<void> {
  await prisma.botApiKey.update({
    where: { id },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Lista todas las API keys con sus estadísticas
 * @returns Lista de API keys (sin exponer hashedKey)
 */
export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const keys = await prisma.botApiKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Para cada key, calcular estadísticas
  const results = await Promise.all(
    keys.map(async (key) => {
      // Contar usos en las últimas 24h
      const requestCount = await prisma.webhookLog.count({
        where: {
          source: 'bot',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        id: key.id,
        name: key.name,
        rateLimit: key.rateLimit,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        requestCount,
      };
    })
  );

  return results;
}

/**
 * Servicio principal de API keys para bots
 * Exporta todas las funciones como métodos estáticos de una clase
 */
export class BotApiKeyService {
  static generateApiKey = generateApiKey;
  static create = createApiKey;
  static validate = validateApiKey;
  static rotate = rotateApiKey;
  static revoke = revokeApiKey;
  static list = listApiKeys;
}
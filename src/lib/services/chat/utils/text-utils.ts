import { logger } from '@/lib/logger/logger.service';

export const STOPWORDS = [
  "precio", "costo", "cuanto", "cuesta",
  "vale", "esta", "del", "de", "la", "el",
  "los", "las", "price", "cost", "how",
  "much", "what", "is", "the", "of"
];

/**
 * Limpia el término de búsqueda eliminando caracteres especiales peligrosos
 * y normalizando espacios, pero manteniendo la frase completa.
 * 
 * @param searchTerm Término de búsqueda original
 * @returns Término limpio
 */
export function cleanSearchTerm(searchTerm: string): string {
  if (!searchTerm) return '';

  const original = searchTerm;
  const refined = searchTerm
    .trim()
    .replace(/[;'"\\/<>{}[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (original !== refined) {
    logger.info(`[SearchTerm] Refined searchTerm from "${original}" to "${refined}"`);
  }
  
  return refined;
}

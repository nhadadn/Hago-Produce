import { logger } from '@/lib/logger/logger.service';

export const STOPWORDS = [
  "precio", "costo", "cuanto", "cuesta",
  "vale", "esta", "del", "de", "la", "el",
  "los", "las", "price", "cost", "how",
  "much", "what", "is", "the", "of"
];

/**
 * Limpia el término de búsqueda eliminando stopwords si la frase es larga.
 * Si el resultado de la limpieza es vacío, devuelve el término original.
 * 
 * @param searchTerm Término de búsqueda original
 * @returns Término limpio o original
 */
export function cleanSearchTerm(searchTerm: string): string {
  if (!searchTerm) return '';
  
  // Guardia defensiva: limpieza de searchTerm si contiene muchas palabras
  if (searchTerm.split(/\s+/).length > 2) {
    const words = searchTerm.split(/\s+/);
    const validWords = words.filter(w => w.length > 2 && !STOPWORDS.includes(w.toLowerCase()));
    
    if (validWords.length > 0) {
      const original = searchTerm;
      const refined = validWords[0];
      logger.info(`[SearchTerm] Refined searchTerm from "${original}" to "${refined}"`);
      return refined;
    }
  }
  
  return searchTerm;
}

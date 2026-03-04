import prisma from '@/lib/db';
import { ChatLanguage, QueryExecutionResult } from '@/lib/chat/types';

export async function customerInfoIntent(
  params: any,
  language: ChatLanguage,
  confidence: number
): Promise<QueryExecutionResult> {
  const { customerName, customerEmail, customerTaxId, searchType } = params;
  
  // Fallback para búsqueda general si no vienen parámetros específicos
  const searchTerm = params.searchTerm || customerName || params.customer_name || params.rawMessage;

  // Si no hay ningún término de búsqueda, retornamos null
  if (!searchTerm && !customerEmail && !customerTaxId) {
    return {
      intent: 'customer_info',
      confidence,
      language,
      data: null,
      sources: [],
    };
  }

  // MUST 1: Filtro base isActive: true obligatorio
  let whereClause: any = { isActive: true };

  // MUST 2: Routing por searchType
  if (searchType === 'by_email' && customerEmail) {
    whereClause = {
      ...whereClause,
      email: { contains: customerEmail, mode: 'insensitive' }
    };
  } else if (searchType === 'by_taxid' && customerTaxId) {
    whereClause = {
      ...whereClause,
      taxId: { equals: customerTaxId, mode: 'insensitive' } // Búsqueda exacta para ID
    };
  } else if (searchType === 'by_name' && customerName) {
    whereClause = {
      ...whereClause,
      name: { contains: customerName, mode: 'insensitive' }
    };
  } else {
    // Fallback 'unknown' o sin searchType: búsqueda amplia por nombre
    const finalTerm = customerName || searchTerm;
    if (finalTerm) {
      whereClause = {
        ...whereClause,
        name: { contains: finalTerm, mode: 'insensitive' }
      };
    }
  }

  // Ejecutar búsqueda principal
  let customers = await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      taxId: true,
      // isActive implícito por el filtro
    },
    take: 5,
  });

  // SHOULD 1: Sugerencias si no hay resultados (solo para búsqueda por nombre)
  let suggestions: any[] = [];
  const isNameSearch = (!searchType || searchType === 'by_name' || searchType === 'unknown');
  
  if (customers.length === 0 && isNameSearch && (customerName || searchTerm)) {
    const term = customerName || searchTerm;
    if (typeof term === 'string' && term.length >= 3) {
      const shortTerm = term.substring(0, 4);
      const suggestedCustomers = await prisma.customer.findMany({
        where: {
          isActive: true, // MUST 1
          name: { contains: shortTerm, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
        },
        take: 3
      });
      suggestions = suggestedCustomers;
    }
  }

  // Si después de todo no hay clientes ni sugerencias
  if (customers.length === 0 && suggestions.length === 0) {
    return {
      intent: 'customer_info',
      confidence,
      language,
      data: {
        found: false,
        searchTerm: customerTaxId || customerEmail || searchTerm,
      },
      sources: [],
    };
  }

  // Si solo hay sugerencias pero no resultados exactos
  if (customers.length === 0 && suggestions.length > 0) {
    return {
      intent: 'customer_info',
      confidence,
      language,
      data: {
        found: false,
        searchTerm: customerName || searchTerm,
        suggestions: suggestions.map(s => s.name)
      },
      sources: [],
    };
  }

  // SHOULD 3: Resumen de actividad (Optimizado N+1)
  const customerIds = customers.map(c => c.id);
  
  // Agrupación por customerId para obtener conteo y última fecha
  const invoiceStats = await prisma.invoice.groupBy({
    by: ['customerId'],
    where: {
      customerId: { in: customerIds },
      // Opcional: filtrar por status si el negocio lo requiere, 
      // pero "actividad" suele implicar cualquier factura.
      // Dejamos abierto para ver todo el historial.
    },
    _count: {
      id: true
    },
    _max: {
      issueDate: true
    }
  });

  // Crear mapa para acceso rápido: customerId -> { total, lastDate }
  const statsMap = new Map<string, { totalInvoices: number, lastInvoiceDate: Date | null }>();
  
  invoiceStats.forEach(stat => {
    statsMap.set(stat.customerId, {
      totalInvoices: stat._count.id,
      lastInvoiceDate: stat._max.issueDate
    });
  });

  // Combinar datos de clientes con estadísticas
  const enrichedCustomers = customers.map(c => {
    const stats = statsMap.get(c.id) || { totalInvoices: 0, lastInvoiceDate: null };
    return {
      ...c,
      isActive: true, // MUST 3 explicit return
      activitySummary: stats
    };
  });

  // SHOULD 2: Múltiples resultados
  const multipleResults = enrichedCustomers.length > 1;

  return {
    intent: 'customer_info',
    confidence,
    language,
    data: {
      found: true,
      count: enrichedCustomers.length,
      multipleResults,
      customers: enrichedCustomers,
    },
    sources: enrichedCustomers.map((c) => ({
      type: 'customer',
      id: c.id,
      label: c.name,
    })),
  };
}

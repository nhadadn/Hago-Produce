
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import prisma from '@/lib/db';
import { generateInvoicePDF } from '@/lib/services/reports/export';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceIds } = await req.json();
    
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return NextResponse.json({ error: 'invoiceIds required' }, { status: 400 });
    }
    if (invoiceIds.length > 50) {
        return NextResponse.json({ error: 'Max 50 invoices per download' }, { status: 400 });
    }

    // Verificar que todas las facturas pertenecen al cliente (si es cliente)
    const invoices = await prisma.invoice.findMany({
        where: {
        id: { in: invoiceIds },
        ...(user.role === 'CUSTOMER' ? { customer: { users: { some: { id: user.userId } } } } : {}),
        },
        include: { customer: true, items: { include: { product: true } } },
    });

    if (invoices.length !== invoiceIds.length) {
        // Si el número de facturas encontradas no coincide con las solicitadas, 
        // significa que alguna no existe o no pertenece al usuario.
        // Para simplificar, retornamos error, o podríamos descargar solo las encontradas.
        // El prompt sugiere: "Some invoices not found or unauthorized"
        return NextResponse.json({ error: 'Some invoices not found or unauthorized' }, { status: 403 });
    }

    // Generar ZIP con PDFs
    const zip = new JSZip();
    
    for (const invoice of invoices) {
        const pdfData = {
            invoiceNumber: invoice.number,
            customerName: invoice.customer.name,
            date: invoice.issueDate,
            items: invoice.items.map((item) => ({
                description: item.description || item.product?.name || 'Item',
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                total: Number(item.quantity) * Number(item.unitPrice),
            })),
            subtotal: Number(invoice.subtotal),
            taxAmount: Number(invoice.taxAmount),
            total: Number(invoice.total),
        };

        const pdfBuffer = generateInvoicePDF(pdfData);
        // Sanitizar nombre de archivo
        const safeCustomerName = invoice.customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${invoice.number}-${safeCustomerName}.pdf`;
        zip.file(filename, pdfBuffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    
    return new NextResponse(zipBlob, {
        headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="facturas-${new Date().toISOString().split('T')[0]}.zip"`,
        },
    });
  } catch (error) {
      console.error("Error generating ZIP:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

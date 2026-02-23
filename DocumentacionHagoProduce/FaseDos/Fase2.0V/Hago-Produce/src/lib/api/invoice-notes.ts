export interface InvoiceNote {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export async function fetchInvoiceNotes(invoiceId: string): Promise<InvoiceNote[]> {
  const res = await fetch(`/api/v1/invoices/${invoiceId}/notes`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al obtener notas de factura');
  }

  const result = await res.json();
  return result.data;
}

export async function createInvoiceNote(
  invoiceId: string,
  content: string,
): Promise<InvoiceNote> {
  const res = await fetch(`/api/v1/invoices/${invoiceId}/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Error al crear nota de factura');
  }

  const result = await res.json();
  return result.data;
}


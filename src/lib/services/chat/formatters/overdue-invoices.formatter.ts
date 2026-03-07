function formatDate(iso: string, language: 'en' | 'es'): string {
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthsEs = ['ene','feb','mar','abr','may','jun',
                    'jul','ago','sep','oct','nov','dic'];
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear());
  if (language === 'es') {
    return day + ' ' + monthsEs[d.getMonth()] + ' ' + year;
  }
  return monthsEn[d.getMonth()] + ' ' + day + ', ' + year;
}

export function formatOverdueInvoices(
  data: any,
  language: 'en' | 'es'
): string | null {
  if (!data || typeof data !== 'object' || data.type !== 'overdue_invoices') {
    return null;
  }

  // CASE 1 — Multiple customers found
  if (data.found === false && data.multiple === true) {
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    if (language === 'es') {
      return 'Varios clientes encontrados. ¿Quisiste decir: ' + suggestions.slice(0,3).join(', ') + '?';
    }
    return 'Multiple customers found. Did you mean: ' + suggestions.slice(0,3).join(', ') + '?';
  }

  // CASE 2 — Customer not found (no multiple)
  if (data.found === false) {
    return String(data.message || (language === 'en' ? 'Customer not found.' : 'Cliente no encontrado.'));
  }

  // CASE 3 — Single customer
  if (data.mode === 'single_customer') {
    const name = String(data.customerName || '');
    const totalOverdue = Number(data.totalOverdue || 0).toFixed(2);
    const grandTotal = Number(data.grandTotalOverdue || 0).toFixed(2);
    const invoicesCount = String(data.invoicesCount || 0);
    const currency = String(data.currency || 'CAD');
    const items = Array.isArray(data.items) ? data.items : [];

    const lines: string[] = [];

    if (language === 'es') {
      lines.push('⚠️ Facturas vencidas de ' + name);
      lines.push('');
      lines.push('Total vencido:  $' + totalOverdue + ' ' + currency);
      lines.push('Gran total:     $' + grandTotal + ' ' + currency);
      lines.push('Facturas:       ' + invoicesCount);
      lines.push('');
      lines.push('Detalle:');
    } else {
      lines.push('⚠️ Overdue invoices for ' + name);
      lines.push('');
      lines.push('Total overdue:  $' + totalOverdue + ' ' + currency);
      lines.push('Grand total:    $' + grandTotal + ' ' + currency);
      lines.push('Invoices:       ' + invoicesCount);
      lines.push('');
      lines.push(language === 'en' ? 'Details:' : 'Detalle:');
    }

    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const item = items[i];
      const invNum = String(item.invoiceNumber || '');
      const invTotal = Number(item.total || 0).toFixed(2);
      const invCurrency = String(item.currency || 'CAD');
      const days = String(item.daysOverdue || 0);
      const urgency = String(item.urgencyLabel || '');
      const dueDate = item.dueDate ? formatDate(item.dueDate, language) : 'N/A';

      if (language === 'es') {
        lines.push(invNum + '  ·  $' + invTotal + ' ' + invCurrency + '  ·  ' + days + ' días  ·  ' + urgency + '  ·  Vence: ' + dueDate);
      } else {
        lines.push(invNum + '  ·  $' + invTotal + ' ' + invCurrency + '  ·  ' + days + ' days  ·  ' + urgency + '  ·  Due: ' + dueDate);
      }
    }

    return lines.join('\n');
  }

  // CASE 4 — Global report empty
  if (data.mode === 'global_report' && (!Array.isArray(data.items) || data.items.length === 0)) {
    if (language === 'es') {
      return 'No se encontraron facturas vencidas' + (data.daysOverdue ? ' de más de ' + data.daysOverdue + ' días.' : '.');
    }
    return 'No overdue invoices found' + (data.daysOverdue ? ' over ' + data.daysOverdue + ' days.' : '.');
  }

  // CASE 5 — Global report with items
  if (data.mode === 'global_report') {
    const grandTotal = Number(data.grandTotalOverdue || 0).toFixed(2);
    const currency = String(data.currency || 'CAD');
    const items = Array.isArray(data.items) ? data.items : [];

    const lines: string[] = [];

    if (language === 'es') {
      lines.push('⚠️ Reporte Global de Vencidos');
      lines.push('');
      lines.push('Gran total:   $' + grandTotal + ' ' + currency);
      lines.push('Clientes:     ' + items.length);
      lines.push('');
      lines.push('Clientes con mayor deuda:');
    } else {
      lines.push('⚠️ Global Overdue Report');
      lines.push('');
      lines.push('Grand total:  $' + grandTotal + ' ' + currency);
      lines.push('Customers:    ' + items.length);
      lines.push('');
      lines.push('Top overdue customers:');
    }

    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const item = items[i];
      const cName = String(item.customerName || '');
      const cTotal = Number(item.totalOverdue || 0).toFixed(2);
      const cCurrency = String(item.currency || 'CAD');
      const cCount = String(item.invoicesCount || 0);
      lines.push((i + 1) + '. ' + cName + '  ·  $' + cTotal + ' ' + cCurrency + '  ·  ' + cCount + ' inv.');
    }

    return lines.join('\n');
  }

  return null;
}
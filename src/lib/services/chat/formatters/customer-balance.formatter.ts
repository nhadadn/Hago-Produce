export function formatCustomerBalance(
  data: any,
  language: 'en' | 'es'
): string | null {
  if (!data || typeof data !== 'object' || data.type !== 'customer_balance') {
    return null;
  }

  if (data.mode === 'single_customer') {
    const items = Array.isArray(data.items) ? data.items : [];
    const item = items[0];
    if (!item) {
      return language === 'en'
        ? 'Balance information is not available.'
        : 'La informacion de saldo no esta disponible.';
    }

    const outstanding = Number(data.totalOutstanding || 0).toFixed(2);
    const overdue = Number(item.overdueAmount || 0).toFixed(2);
    const pending = Number(item.pendingAmount || 0).toFixed(2);
    const invoices = String(data.invoicesCount || 0);
    const status = String(item.statusMessage || '').trim();
    const name = String(item.customerName || '');
    const currency = String(item.currency || 'CAD');
    const overdueFlag = Number(item.overdueAmount || 0) > 0 ? ' ⚠️' : '';

    if (language === 'es') {
      const lines = [
        '💰 Saldo de ' + name,
        '',
        'Por cobrar:   $' + outstanding + ' ' + currency,
        'Vencido:      $' + overdue + ' ' + currency + overdueFlag,
        'Pendiente:    $' + pending + ' ' + currency,
        'Facturas:     ' + invoices + ' total',
        'Estado:       ' + status,
      ];
      return lines.join('\n');
    }

    const lines = [
      '💰 Balance for ' + name,
      '',
      'Outstanding:  $' + outstanding + ' ' + currency,
      'Overdue:      $' + overdue + ' ' + currency + overdueFlag,
      'Pending:      $' + pending + ' ' + currency,
      'Invoices:     ' + invoices + ' total',
      'Status:       ' + status,
    ];
    return lines.join('\n');
  }

  if (data.mode === 'global_summary') {
    const items = Array.isArray(data.items) ? data.items : [];
    const top = items.slice(0, 5);
    const outstanding = Number(data.totalOutstanding || 0).toFixed(2);
    const invoices = String(data.invoicesCount || 0);
    const count = String(items.length);

    const lines: string[] = language === 'es'
      ? [
          '💰 Saldo Global Pendiente',
          '',
          'Total:        $' + outstanding + ' CAD',
          'Facturas:     ' + invoices,
          'Clientes:     ' + count,
        ]
      : [
          '💰 Global Outstanding Balance',
          '',
          'Total:        $' + outstanding + ' CAD',
          'Invoices:     ' + invoices,
          'Customers:    ' + count,
        ];

    if (top.length > 0) {
      lines.push('');
      lines.push(language === 'es' ? 'Mayores deudores:' : 'Top debtors:');
      for (let i = 0; i < top.length; i++) {
        const d = top[i];
        const dName = String(d.customerName || '');
        const dTotal = Number(d.total || 0).toFixed(2);
        const dCurrency = String(d.currency || 'CAD');
        lines.push((i + 1) + '. ' + dName + ' — $' + dTotal + ' ' + dCurrency);
      }
    }

    return lines.join('\n');
  }

  return null;
}

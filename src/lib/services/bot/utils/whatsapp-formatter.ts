
/**
 * Utility functions for formatting text for WhatsApp.
 * WhatsApp supports:
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 * - ```monospace```
 */

export function convertWebToWhatsApp(text: string): string {
  if (!text) return '';

  let lines = text.split('\n');
  let formattedLines: string[] = [];

  // Regex patterns
  const rankingRegex = /^#(\d+)\s+(.+?)\s+·\s+(.+?)\s+·\s+(\$[\d\.,]+\s+[A-Z]{3})$/;
  const invoiceListRegex = /^(.+?)\s+·\s+(.+?)\s+·\s+(\$[\d\.,]+\s+[A-Z]{3})\s+·\s+(.+?)$/;
  const labelValueRegex = /^([^:]+):\s+(.+)$/;
  const headerRegex = /^(🔍|🏆|📋|📦|⚠️|✅|❌)\s+(.+)$/;
  const dividerRegex = /^-{3,}$/;
  const footerRegex = /^(Prices as of|Precios al|Total:|Sorted cheapest first|Ordenado del más barato).+$/;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) {
      formattedLines.push('');
      continue;
    }

    // Handle Dividers
    if (dividerRegex.test(line)) {
      formattedLines.push('────────────────'); // Use a visual separator that works in WhatsApp
      continue;
    }

    // Handle Headers (start with specific emojis)
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      // Bold the entire header
      formattedLines.push(`*${line}*`);
      continue;
    }

    // Handle Price/Supplier Rankings
    // #1  APPLE RED DELICIOUS BAG  ·  TOMATO KING  ·  $34.00 CAD
    const rankingMatch = line.match(rankingRegex);
    if (rankingMatch) {
      const [_, rank, product, supplier, price] = rankingMatch;
      // Format:
      // #1 *APPLE RED DELICIOUS BAG*
      // _TOMATO KING_ · *34.00 CAD*
      formattedLines.push(`#${rank} *${product.trim()}*`);
      formattedLines.push(`   _${supplier.trim()}_ · *${price.trim()}*`);
      continue;
    }

    // Handle Invoice List Items
    // INVOICE# · STATUS · $TOTAL · Due: DATE
    const invoiceMatch = line.match(invoiceListRegex);
    if (invoiceMatch) {
      const [_, invNum, status, total, dueDate] = invoiceMatch;
      // Format:
      // *INVOICE#* · _STATUS_
      // *TOTAL* · Due: DATE
      formattedLines.push(`*${invNum.trim()}* · _${status.trim()}_`);
      formattedLines.push(`   *${total.trim()}* · ${dueDate.trim()}`);
      continue;
    }

    // Handle Label: Value pairs (Invoice details, etc)
    // Customer:  TOMATO KING
    const labelMatch = line.match(labelValueRegex);
    if (labelMatch) {
      const [_, label, value] = labelMatch;
      // Avoid formatting if it looks like natural text (check length/structure?)
      // But for invoice details it's usually short.
      if (label.length < 20) {
        formattedLines.push(`*${label.trim()}:* ${value.trim()}`);
        continue;
      }
    }

    // Handle Footers (Prices as of..., Total: ...)
    if (footerRegex.test(line)) {
      formattedLines.push(`_${line}_`);
      continue;
    }

    // Default: preserve line
    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}

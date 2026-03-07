const fs = require('fs');
const c = fs.readFileSync('src/lib/services/chat/formatters/overdue-invoices.formatter.ts', 'utf8');
console.log(c.includes('[object Object]') ? 'CORRUPTO' : 'LIMPIO');
console.log('Bytes:', c.length);